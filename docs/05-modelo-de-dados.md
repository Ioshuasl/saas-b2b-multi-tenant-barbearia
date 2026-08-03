# 05 — Modelo de Dados

Todas as tabelas de negócio têm `tenant_id UUID NOT NULL` (FK → `tenants.id`), `created_at`, `updated_at`, e RLS ativa. IDs são UUID v7 (ordenáveis por tempo). Timestamps em `timestamptz` (UTC).

## Hierarquia: tenant → unidade

O MVP suporta **barbearias com mais de uma unidade**. São dois níveis:

- **`tenant`** = a empresa/rede. É a fronteira de isolamento, de assinatura e da base de clientes.
- **`location`** (unidade/loja) = onde o atendimento acontece. Tem endereço próprio, horário próprio, equipe própria, agenda própria e **página pública própria**.

Rede com uma unidade só é o caso trivial: o tenant nasce com uma `location` criada automaticamente no onboarding, e a UI esconde o seletor de unidade enquanto houver apenas uma. **O usuário de uma unidade nunca vê complexidade de rede.**

Regra: `tenant_id` continua em todas as tabelas (isolamento). `location_id` entra nas tabelas **operacionais** (agenda, equipe, horários, pagamentos). Ficam no nível do tenant: usuários, catálogo de serviços, clientes e assinatura.

| No nível do TENANT | No nível da LOCATION |
|---|---|
| `users`, `subscriptions`, `invoices` | `staff`, `business_hours`, `time_blocks` |
| `services` (catálogo) | `location_services` (ativação e preço por unidade) |
| `customers` (base compartilhada na rede) | `appointments`, `payments` |

**Por que `customers` no tenant:** o cliente que corta na unidade A e vai à unidade B é o mesmo — histórico único é uma vantagem real de rede. `appointments` carrega `location_id`, então o relatório por unidade continua exato.

**Por que `services` no tenant:** a rede quer padronizar catálogo e preço. A unidade pode ativar/desativar e sobrescrever preço via `location_services`.

## Diagrama (texto)

```
tenants 1─┬─* users ──* user_locations *── locations   (escopo de acesso)
          ├─* services ──* location_services *── locations
          ├─* customers ──* appointments
          ├─1 subscriptions ──* invoices
          ├─* audit_logs / notifications
          └─* locations 1─┬─* staff ──* staff_services *── services
                          ├─* business_hours
                          ├─* time_blocks
                          └─* appointments ──* appointment_services *── services
                                           └─* payments
```

## Tabelas

### `tenants`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| slug | citext UNIQUE | raiz pública `/{tenant_slug}`; reservar palavras (`admin`, `api`, `app`…) |
| name | text | nome da rede/barbearia |
| logo_url, brand_color | text | identidade da marca (herdada pelas unidades) |
| status | enum | `TRIALING, ACTIVE, PAST_DUE, NEGOTIATING, SUSPENDED, CANCELED` |
| created_at, updated_at | timestamptz | |

> `tenant_slug_history(slug, tenant_id, expires_at)` para redirecionar slugs antigos.

### `locations` (unidade)
| Campo | Tipo | Notas |
|---|---|---|
| id, tenant_id | uuid | |
| slug | citext | UNIQUE `(tenant_id, slug)`; URL pública `/{tenant_slug}/{location_slug}` |
| name | text | ex.: "Unidade Centro" |
| timezone | text | IANA, default `America/Sao_Paulo`. **Por unidade** — rede pode cruzar fusos |
| phone, email | text | contato da unidade |
| address_* | text | cep, rua, número, complemento, bairro, cidade, uf |
| latitude, longitude | numeric | seletor "unidade mais próxima" |
| cover_url | text | foto da unidade |
| booking_lead_time_minutes | int | antecedência mínima (default 60) |
| booking_horizon_days | int | janela futura (default 60) |
| cancel_deadline_hours | int | default 2 |
| accepts_online_booking | bool | desliga a página pública da unidade |
| is_default | bool | unidade usada quando o tenant tem só uma |
| active | bool | |

Roteamento público:
- `/{tenant_slug}` → se houver 1 unidade ativa, redireciona para ela; se houver várias, mostra o **seletor de unidades** (nome, endereço, distância).
- `/{tenant_slug}/{location_slug}` → página de agendamento da unidade.

### `user_locations`
`tenant_id, user_id, location_id` — PK composta. Define **quais unidades o usuário enxerga**. `OWNER` ignora esta tabela (vê tudo). `MANAGER` é gerente de unidade(s). Sem linha nenhuma para um não-OWNER = sem acesso a nenhuma agenda.

### `users`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| email | citext | UNIQUE (tenant_id, email) |
| password_hash | text | argon2id |
| name, phone | text | |
| role | enum | `OWNER, MANAGER, STAFF, RECEPTIONIST` — escopo de unidade em `user_locations` |
| status | enum | `INVITED, ACTIVE, DISABLED` |
| email_verified_at, last_login_at | timestamptz | |

> `platform_admins` é tabela **separada**, sem `tenant_id`, fora da RLS de tenant.

### `staff` (profissional)
Separado de `users` porque existe profissional que não faz login (cadastrado só para aparecer na agenda) e usuário que não atende (recepcionista).

| Campo | Tipo | Notas |
|---|---|---|
| id, tenant_id | uuid | |
| location_id | uuid FK | **unidade base do profissional** |
| user_id | uuid FK NULL | vínculo opcional com login |
| name, photo_url, bio | text | |
| commission_percent | numeric(5,2) | 0–100 |
| accepts_online_booking | bool | aparece na página pública |
| active | bool | |

Profissional que atende em mais de uma unidade: `staff_locations(tenant_id, staff_id, location_id)`. A jornada dele em cada unidade vem de `business_hours` com `location_id` + `staff_id`. **A constraint de não sobreposição é por `staff_id` (sem `location_id`)** — assim o sistema impede que o mesmo barbeiro seja agendado em duas unidades ao mesmo tempo, que é exatamente o bug que uma rede sofre.

### `services` (catálogo da rede)
`id, tenant_id, name, description, duration_minutes int, buffer_minutes int default 0, price_cents int, color, active bool, visible_online bool, sort_order int`

### `location_services`
`tenant_id, location_id, service_id, price_cents_override NULL, duration_minutes_override NULL, active bool` — PK `(location_id, service_id)`.
Permite que a unidade do bairro nobre cobre mais caro pelo mesmo corte. Sem linha = herda o catálogo do tenant.

### `staff_services`
`tenant_id, staff_id, service_id` — PK composta. Se vazio para um staff, assume-se que ele faz todos os serviços ativos (regra explícita para simplificar onboarding).

### `business_hours`
`id, tenant_id, location_id, staff_id NULL, weekday smallint (0–6), starts_at time, ends_at time`
Múltiplas linhas por dia permitem intervalo de almoço. `staff_id NULL` = horário da **unidade**; com `staff_id` = jornada do profissional naquela unidade (sobrepõe).

### `time_blocks`
`id, tenant_id, location_id, staff_id NULL, starts_at timestamptz, ends_at timestamptz, reason text, recurrence_rule text NULL (RRULE)`
`staff_id NULL` bloqueia a unidade inteira (feriado). Feriado da rede = criar em todas as unidades (a UI oferece "aplicar a todas as unidades").

### `customers`
`id, tenant_id, first_location_id, name, phone (E.164), email NULL, notes, birthdate NULL, marketing_opt_in bool, created_at`
UNIQUE `(tenant_id, phone)` — o mesmo telefone em **redes** diferentes são clientes distintos (importante para LGPD e para o modelo B2B: a base é do tenant). Dentro da mesma rede, o cliente é único e circula entre unidades; `first_location_id` guarda onde ele apareceu pela primeira vez.

### `appointments`
| Campo | Tipo | Notas |
|---|---|---|
| id, tenant_id | uuid | |
| location_id | uuid FK | **unidade do atendimento** |
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
- Índices: `(tenant_id, location_id, starts_at)`, `(tenant_id, staff_id, starts_at)`, `(tenant_id, customer_id)`.
- `CHECK` de coerência: o `staff_id` precisa estar vinculado à `location_id` (validado por FK composta contra `staff_locations`).

### `appointment_services`
`id, tenant_id, appointment_id, service_id, price_cents, duration_minutes` — snapshot: alterar o serviço depois não muda o histórico.

### `payments`
`id, tenant_id, location_id, appointment_id, amount_cents, method enum(CASH,PIX,DEBIT,CREDIT,OTHER), paid_at, created_by`
Um atendimento pode ter mais de um pagamento (divisão). No MVP, normalmente um.

### `subscriptions` (assinatura da barbearia com a plataforma)
`id, tenant_id UNIQUE, plan_code, status enum(TRIALING,ACTIVE,PAST_DUE,NEGOTIATING,CANCELED,SUSPENDED), trial_ends_at, current_period_start, current_period_end, provider, provider_customer_id, provider_subscription_id, seats int, locations_count int, grace_until timestamptz NULL, canceled_at`

A assinatura é **uma por rede**, com preço em função de nº de profissionais ativos + nº de unidades ativas. `grace_until` é o prazo negociado manualmente na inadimplência (ver [08](08-billing-planos.md)).

### `invoices`
`id, tenant_id, subscription_id, provider_invoice_id, amount_cents, status, due_date, paid_at, url`

### `notifications`
`id, tenant_id, location_id NULL, appointment_id NULL, channel enum(EMAIL,WHATSAPP,SMS), provider, template, variables jsonb, recipient, scheduled_for, sent_at, status enum(PENDING,SENT,FAILED,CANCELED), provider_message_id, error`

`provider` e `variables` existem desde o dia 1 para permitir a troca Evolution API → API oficial sem migração de dados (ver [14](14-whatsapp-notificacoes.md)).
Índice `(status, scheduled_for)` para o worker. Cancelar notificação pendente quando o agendamento é cancelado.

### `audit_logs`
`id, tenant_id NULL, actor_user_id NULL, actor_platform_admin_id NULL, action, entity, entity_id, before jsonb, after jsonb, ip, user_agent, created_at`
Obrigatório para: impersonation, exclusão de dados, mudanças de billing e de permissões.

### `webhook_events`
`id, provider, provider_event_id UNIQUE, payload jsonb, processed_at, error` — idempotência de webhooks de pagamento.

## Regras de integridade que valem código

1. Todas as FKs incluem `tenant_id` na relação (FK composta `(tenant_id, id)`) para impossibilitar referência cruzada entre tenants. Nas tabelas operacionais, a FK inclui também `location_id`, impedindo agendar um profissional da unidade A na agenda da unidade B.
2. `ends_at` nunca é informado pelo cliente — é sempre calculado no servidor a partir dos serviços.
3. Preço e duração são copiados (snapshot) para `appointment_services`.
4. Exclusão é lógica (`deleted_at`) para serviços/profissionais com histórico; exclusão física só via rotina de LGPD.
5. Nenhuma query da aplicação passa `tenant_id` vindo do body/query string.
6. `location_id` **é** parâmetro legítimo de request (o usuário troca de unidade na UI), mas sempre validado contra `user_locations` — nunca aceito por confiança.
