# 05 — Modelo de Dados

Todas as tabelas de negócio têm `tenant_id UUID NOT NULL` (FK → `tenants.id`), `created_at`, `updated_at`, e RLS ativa. IDs são UUID v7 (ordenáveis por tempo). Timestamps em `timestamptz` (UTC).

## Diagrama (texto)

```
tenants 1─┬─* users
          ├─* services
          ├─* staff ──* staff_services *── services
          ├─* business_hours
          ├─* time_blocks
          ├─* customers ──* appointments
          ├─* appointments ──* appointment_services *── services
          │                └─1 payments
          ├─1 subscriptions ──* invoices
          └─* audit_logs / notifications
```

## Tabelas

### `tenants`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| slug | citext UNIQUE | página pública `/{slug}`; reservar palavras (`admin`, `api`, `app`…) |
| name | text | nome da barbearia |
| timezone | text | IANA, default `America/Sao_Paulo` |
| phone, email | text | contato |
| address_* | text | cep, rua, número, bairro, cidade, uf |
| logo_url, cover_url, brand_color | text | página pública |
| status | enum | `TRIALING, ACTIVE, PAST_DUE, SUSPENDED, CANCELED` |
| booking_lead_time_minutes | int | antecedência mínima (default 60) |
| booking_horizon_days | int | janela futura (default 60) |
| cancel_deadline_hours | int | default 2 |
| created_at, updated_at | timestamptz | |

> `tenant_slug_history(slug, tenant_id, expires_at)` para redirecionar slugs antigos.

### `users`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| email | citext | UNIQUE (tenant_id, email) |
| password_hash | text | argon2id |
| name, phone | text | |
| role | enum | `OWNER, MANAGER, STAFF, RECEPTIONIST` |
| status | enum | `INVITED, ACTIVE, DISABLED` |
| email_verified_at, last_login_at | timestamptz | |

> `platform_admins` é tabela **separada**, sem `tenant_id`, fora da RLS de tenant.

### `staff` (profissional)
Separado de `users` porque existe profissional que não faz login (cadastrado só para aparecer na agenda) e usuário que não atende (recepcionista).

| Campo | Tipo | Notas |
|---|---|---|
| id, tenant_id | uuid | |
| user_id | uuid FK NULL | vínculo opcional com login |
| name, photo_url, bio | text | |
| commission_percent | numeric(5,2) | 0–100 |
| accepts_online_booking | bool | aparece na página pública |
| active | bool | |

### `services`
`id, tenant_id, name, description, duration_minutes int, buffer_minutes int default 0, price_cents int, color, active bool, visible_online bool, sort_order int`

### `staff_services`
`tenant_id, staff_id, service_id` — PK composta. Se vazio para um staff, assume-se que ele faz todos os serviços ativos (regra explícita para simplificar onboarding).

### `business_hours`
`id, tenant_id, staff_id NULL, weekday smallint (0–6), starts_at time, ends_at time`
Múltiplas linhas por dia permitem intervalo de almoço. `staff_id NULL` = horário da barbearia; com `staff_id` = jornada específica do profissional (sobrepõe).

### `time_blocks`
`id, tenant_id, staff_id NULL, starts_at timestamptz, ends_at timestamptz, reason text, recurrence_rule text NULL (RRULE)`
`staff_id NULL` bloqueia a barbearia inteira (feriado).

### `customers`
`id, tenant_id, name, phone (E.164), email NULL, notes, birthdate NULL, marketing_opt_in bool, created_at`
UNIQUE `(tenant_id, phone)` — o mesmo telefone em barbearias diferentes são clientes distintos (importante para LGPD e para o modelo B2B: a base é do tenant).

### `appointments`
| Campo | Tipo | Notas |
|---|---|---|
| id, tenant_id | uuid | |
| customer_id | uuid FK | |
| staff_id | uuid FK | |
| starts_at, ends_at | timestamptz | `ends_at` derivado da soma das durações |
| status | enum | `AGENDADO, CONFIRMADO, EM_ATENDIMENTO, CONCLUIDO, CANCELADO, NO_SHOW` |
| source | enum | `PUBLIC_PAGE, PANEL, PHONE, WALKIN` |
| total_price_cents | int | snapshot do preço no momento da reserva |
| notes | text | |
| cancel_token | uuid | link público de cancelamento |
| canceled_at, canceled_by, cancel_reason | | |
| created_at, updated_at | | |

Constraints/índices:
- `EXCLUDE USING gist` de não sobreposição (ver [04](04-arquitetura-multi-tenancy.md)).
- `CHECK (ends_at > starts_at)`.
- Índices: `(tenant_id, starts_at)`, `(tenant_id, staff_id, starts_at)`, `(tenant_id, customer_id)`.

### `appointment_services`
`id, tenant_id, appointment_id, service_id, price_cents, duration_minutes` — snapshot: alterar o serviço depois não muda o histórico.

### `payments`
`id, tenant_id, appointment_id, amount_cents, method enum(CASH,PIX,DEBIT,CREDIT,OTHER), paid_at, created_by`
Um atendimento pode ter mais de um pagamento (divisão). No MVP, normalmente um.

### `subscriptions` (assinatura da barbearia com a plataforma)
`id, tenant_id UNIQUE, plan_code, status enum(TRIALING,ACTIVE,PAST_DUE,CANCELED,SUSPENDED), trial_ends_at, current_period_start, current_period_end, provider, provider_customer_id, provider_subscription_id, seats int, canceled_at`

### `invoices`
`id, tenant_id, subscription_id, provider_invoice_id, amount_cents, status, due_date, paid_at, url`

### `notifications`
`id, tenant_id, appointment_id NULL, channel enum(EMAIL,WHATSAPP,SMS), template, recipient, scheduled_for, sent_at, status enum(PENDING,SENT,FAILED,CANCELED), provider_message_id, error`
Índice `(status, scheduled_for)` para o worker. Cancelar notificação pendente quando o agendamento é cancelado.

### `audit_logs`
`id, tenant_id NULL, actor_user_id NULL, actor_platform_admin_id NULL, action, entity, entity_id, before jsonb, after jsonb, ip, user_agent, created_at`
Obrigatório para: impersonation, exclusão de dados, mudanças de billing e de permissões.

### `webhook_events`
`id, provider, provider_event_id UNIQUE, payload jsonb, processed_at, error` — idempotência de webhooks de pagamento.

## Regras de integridade que valem código

1. Todas as FKs incluem `tenant_id` na relação (FK composta `(tenant_id, id)`) para impossibilitar referência cruzada entre tenants.
2. `ends_at` nunca é informado pelo cliente — é sempre calculado no servidor a partir dos serviços.
3. Preço e duração são copiados (snapshot) para `appointment_services`.
4. Exclusão é lógica (`deleted_at`) para serviços/profissionais com histórico; exclusão física só via rotina de LGPD.
5. Nenhuma query da aplicação passa `tenant_id` vindo do body/query string.
