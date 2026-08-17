# 07 — Modelo de Dados

Convenções: PostgreSQL, `snake_case` nas tabelas/colunas, PK `uuid` (v7 gerado na aplicação — [ADR-0011](./adr/0011-uuid-v7-aplicacao.md)), `tenant_id uuid NOT NULL` em toda tabela operacional, `created_at`/`updated_at timestamptz`, dinheiro em **centavos** (`bigint`), timestamps em **UTC**, soft delete apenas onde indicado (`deleted_at`). Prisma modela o CRUD; RLS, `EXCLUDE`, colunas geradas, views e triggers entram como **SQL manual** na migração ([ADR-0004](./adr/0004-orm-prisma.md)).

## 1. Diagrama de contexto (agregados por módulo)

```
┌ locations ──────────────────┐  ┌ identity ────────────────┐
│ tenant                      │  │ user                     │
│ location                    │  │ invitation               │
│ business_hours              │  │ refresh_token_family     │
│ time_block                  │  │ user_locations           │
│ service / location_service  │  └──────────────────────────┘
│ staff / staff_location      │
└─────────────────────────────┘  ┌ subscription ────────────┐
                                 │ plan / plan_feature      │
┌ customers ──────────────────┐  │ subscription / invoice   │
│ customer                    │  │ usage_counter            │
└─────────┬───────────────────┘  └──────────────────────────┘
          │
┌ scheduling ─────────────────┐  ┌ messaging ───────────────┐
│ appointment                 │  │ whatsapp_account         │
│ appointment_service         │  │ message_template         │
│ appointment_history         │  │ automation / run         │
└─────────┬───────────────────┘  │ notification             │
          │                      └──────────────────────────┘
┌ billing ────────────────────┐
│ payment                     │  ┌ platform ────────────────┐
└─────────────────────────────┘  │ outbox_event             │
                                 │ audit_log                │
                                 │ tenant_crypto_key        │
                                 │ data_subject_request     │
                                 └──────────────────────────┘
```

`reporting` não persiste agregado próprio — só views (`security_invoker`).

Inbox (`conversation` / `message`) e caixa do dia **não** entram no schema do MVP; reserva na fase 2.

## 2. Tabelas — identity e locations

```sql
CREATE TABLE tenant (
  id                uuid PRIMARY KEY,
  name              text NOT NULL,
  slug              citext NOT NULL UNIQUE,   -- /{slug}
  logo_url          text,
  brand_color       text,
  status            text NOT NULL DEFAULT 'TRIALING',
    -- TRIALING|ACTIVE|PAST_DUE|NEGOTIATING|SUSPENDED|CANCELED
  trial_ends_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenant_slug_history (
  slug         citext PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES tenant(id),
  expires_at   timestamptz NOT NULL
);

CREATE TABLE location (
  id                          uuid PRIMARY KEY,
  tenant_id                   uuid NOT NULL REFERENCES tenant(id),
  slug                        citext NOT NULL,          -- UNIQUE (tenant_id, slug)
  name                        text NOT NULL,
  timezone                    text NOT NULL DEFAULT 'America/Sao_Paulo',
  phone                       text,
  email                       citext,
  address                     jsonb,   -- {zip, street, number, complement, district, city, state}
  latitude                    numeric,
  longitude                   numeric,
  cover_url                   text,
  booking_lead_time_minutes   integer NOT NULL DEFAULT 60,
  booking_horizon_days        integer NOT NULL DEFAULT 60,
  cancel_deadline_hours       integer NOT NULL DEFAULT 2,
  accepts_online_booking      boolean NOT NULL DEFAULT true,
  is_default                  boolean NOT NULL DEFAULT false,
  active                      boolean NOT NULL DEFAULT true,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
CREATE UNIQUE INDEX uq_location_default ON location (tenant_id) WHERE is_default;

CREATE TABLE location_slug_history (
  tenant_id    uuid NOT NULL,
  slug         citext NOT NULL,
  location_id  uuid NOT NULL REFERENCES location(id),
  expires_at   timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, slug)
);

CREATE TABLE "user" (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL REFERENCES tenant(id),  -- 1 user = 1 tenant no MVP
  email              citext NOT NULL UNIQUE,               -- global: RF-E1-17
  password_hash      text NOT NULL,                        -- Argon2id
  name               text NOT NULL,
  phone              text,
  role               text NOT NULL,  -- OWNER|MANAGER|STAFF|RECEPTIONIST
  status             text NOT NULL DEFAULT 'INVITED',      -- INVITED|ACTIVE|DISABLED
  email_verified_at  timestamptz,
  last_login_at      timestamptz,
  failed_attempts    smallint NOT NULL DEFAULT 0,
  locked_until       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_location (
  tenant_id    uuid NOT NULL,
  user_id      uuid NOT NULL REFERENCES "user"(id),
  location_id  uuid NOT NULL REFERENCES location(id),
  PRIMARY KEY (tenant_id, user_id, location_id)
);
-- OWNER ignora esta tabela. Sem linha para não-OWNER = sem agenda.

CREATE TABLE invitation (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES tenant(id),
  email         citext NOT NULL,
  role          text NOT NULL,
  location_ids  uuid[] NOT NULL DEFAULT '{}',
  token_hash    text NOT NULL UNIQUE,
  expires_at    timestamptz NOT NULL,
  accepted_at   timestamptz,
  invited_by    uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refresh_token_family (
  id           uuid PRIMARY KEY,
  tenant_id    uuid NOT NULL,
  user_id      uuid NOT NULL REFERENCES "user"(id),
  family_id    uuid NOT NULL,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_family ON refresh_token_family (user_id, family_id);

CREATE TABLE platform_admin (
  id                 uuid PRIMARY KEY,
  email              citext NOT NULL UNIQUE,
  password_hash      text NOT NULL,
  name               text NOT NULL,
  mfa_secret_ref     text NOT NULL,          -- TOTP; MFA obrigatório
  last_login_at      timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff (
  id                      uuid PRIMARY KEY,
  tenant_id               uuid NOT NULL,
  home_location_id        uuid NOT NULL REFERENCES location(id),  -- unidade base
  user_id                 uuid REFERENCES "user"(id),             -- login opcional
  name                    text NOT NULL,
  photo_url               text,
  bio                     text,
  commission_percent      numeric(5,2) NOT NULL DEFAULT 0 CHECK (commission_percent BETWEEN 0 AND 100),
  accepts_online_booking  boolean NOT NULL DEFAULT true,
  active                  boolean NOT NULL DEFAULT true,
  deleted_at              timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff_location (
  tenant_id    uuid NOT NULL,
  staff_id     uuid NOT NULL REFERENCES staff(id),
  location_id  uuid NOT NULL REFERENCES location(id),
  PRIMARY KEY (tenant_id, staff_id, location_id)
);

CREATE TABLE service (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL,
  name               text NOT NULL,
  description        text,
  duration_minutes   smallint NOT NULL CHECK (duration_minutes BETWEEN 5 AND 480),
  buffer_minutes     smallint NOT NULL DEFAULT 0,
  price_cents        bigint NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  color              text,
  active             boolean NOT NULL DEFAULT true,
  visible_online     boolean NOT NULL DEFAULT true,
  sort_order         integer NOT NULL DEFAULT 0,
  deleted_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE location_service (
  tenant_id                   uuid NOT NULL,
  location_id                 uuid NOT NULL REFERENCES location(id),
  service_id                  uuid NOT NULL REFERENCES service(id),
  price_cents_override        bigint,
  duration_minutes_override   smallint,
  active                      boolean NOT NULL DEFAULT true,
  PRIMARY KEY (location_id, service_id)
);

CREATE TABLE staff_service (
  tenant_id   uuid NOT NULL,
  staff_id    uuid NOT NULL REFERENCES staff(id),
  service_id  uuid NOT NULL REFERENCES service(id),
  PRIMARY KEY (staff_id, service_id)
);
-- Vazio para um staff = executa todos os serviços ativos (onboarding).

CREATE TABLE service_catalog_template (   -- global, sem tenant_id
  code              text PRIMARY KEY,     -- CORTE|BARBA|CORTE_BARBA
  name              text NOT NULL,
  duration_minutes  smallint NOT NULL,
  sort_order        integer NOT NULL
);

CREATE TABLE business_hours (
  id           uuid PRIMARY KEY,
  tenant_id    uuid NOT NULL,
  location_id  uuid NOT NULL REFERENCES location(id),
  staff_id     uuid REFERENCES staff(id),   -- NULL = horário da unidade
  weekday      smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7), -- ISO 1=Mon
  starts_at    time NOT NULL,
  ends_at      time NOT NULL,
  CHECK (ends_at > starts_at)
);

CREATE TABLE time_block (
  id           uuid PRIMARY KEY,
  tenant_id    uuid NOT NULL,
  location_id  uuid NOT NULL REFERENCES location(id),
  staff_id     uuid REFERENCES staff(id),   -- NULL = unidade inteira
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  period       tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED,
  reason       text NOT NULL,
  rrule        text,                        -- RRULE; NULL = pontual
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
```

## 3. Tabelas — customers

```sql
CREATE TABLE customer (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL,
  first_location_id  uuid NOT NULL REFERENCES location(id),
  name               text NOT NULL,
  phone              text NOT NULL,          -- E.164
  email              citext,
  notes              text,                   -- ciphertext envelope v1 (ADR-0007)
  birthdate          date,
  marketing_opt_in   boolean NOT NULL DEFAULT false,
  origin             text NOT NULL DEFAULT 'PANEL',  -- PUBLIC_PAGE|PANEL|PHONE|WALKIN
  active             boolean NOT NULL DEFAULT true,
  deleted_at         timestamptz,            -- anonimização LGPD
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_customer_phone ON customer (tenant_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_name_trgm ON customer USING gin (name gin_trgm_ops);
CREATE INDEX idx_customer_phone ON customer (tenant_id, phone);
```

Sem CPF no MVP (minimização). Mesmo telefone em **redes** diferentes = clientes distintos.

## 4. Tabelas — scheduling

```sql
CREATE TABLE appointment (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL,
  location_id        uuid NOT NULL REFERENCES location(id),
  customer_id        uuid NOT NULL REFERENCES customer(id),
  staff_id           uuid NOT NULL REFERENCES staff(id),
  starts_at          timestamptz NOT NULL,
  ends_at            timestamptz NOT NULL,   -- calculado no servidor
  period             tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED,
  status             text NOT NULL DEFAULT 'SCHEDULED',
    -- SCHEDULED|CONFIRMED|IN_SERVICE|COMPLETED|CANCELLED|NO_SHOW
  source             text NOT NULL DEFAULT 'PANEL',  -- PUBLIC_PAGE|PANEL|PHONE|WALKIN
  total_price_cents  bigint NOT NULL DEFAULT 0,
  notes              text,                   -- ciphertext envelope v1
  cancel_token_hash  text UNIQUE,            -- hash do token público; comparação em tempo constante
  canceled_at        timestamptz,
  canceled_by        text,                   -- USER|CUSTOMER|SYSTEM
  cancel_reason      text,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- Profissional não pode estar em duas unidades (nem na mesma) no mesmo intervalo.
ALTER TABLE appointment ADD CONSTRAINT appointment_staff_no_overlap
  EXCLUDE USING gist (
    tenant_id WITH =,
    staff_id  WITH =,
    period    WITH &&
  ) WHERE (status IN ('SCHEDULED', 'CONFIRMED', 'IN_SERVICE'));

CREATE INDEX idx_appointment_agenda  ON appointment (tenant_id, location_id, starts_at);
CREATE INDEX idx_appointment_staff   ON appointment (tenant_id, staff_id, starts_at);
CREATE INDEX idx_appointment_customer ON appointment (tenant_id, customer_id, starts_at DESC);

CREATE TABLE appointment_service (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL,
  appointment_id     uuid NOT NULL REFERENCES appointment(id),
  service_id         uuid NOT NULL REFERENCES service(id),
  price_cents        bigint NOT NULL,        -- snapshot
  duration_minutes   smallint NOT NULL       -- snapshot
);

CREATE TABLE appointment_history (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  appointment_id  uuid NOT NULL REFERENCES appointment(id),
  action          text NOT NULL,             -- CREATED|RESCHEDULED|STATUS_CHANGED|CANCELLED
  from_value      jsonb,
  to_value        jsonb,
  actor_id        uuid,
  actor_type      text NOT NULL,             -- USER|CUSTOMER|SYSTEM
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

Violação `23P01` → `409 SLOT_TAKEN`. `staff_id` precisa existir em `staff_location` da `location_id` (validado no use case + FK composta se o Prisma permitir via SQL).

## 5. Tabelas — billing (financeiro da barbearia)

```sql
CREATE TABLE payment (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  location_id     uuid NOT NULL REFERENCES location(id),
  appointment_id  uuid NOT NULL REFERENCES appointment(id),
  amount_cents    bigint NOT NULL CHECK (amount_cents >= 0),
  method          text NOT NULL,             -- CASH|PIX|DEBIT|CREDIT|OTHER
  paid_at         timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL,
  reversed_at     timestamptz,
  reverse_reason  text,
  reversed_by     uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_appointment ON payment (tenant_id, appointment_id);
CREATE INDEX idx_payment_period ON payment (tenant_id, location_id, paid_at);
```

Comissão **não** é tabela no MVP: derivada de `%` do `staff` × soma de pagamentos não estornados de atendimentos `COMPLETED` no período. Sem sessão de caixa (RF-E5-11 = fase 2).

## 6. Tabelas — messaging

```sql
CREATE TABLE whatsapp_account (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL UNIQUE,   -- 1 sessão / tenant no MVP
  session_name       text NOT NULL UNIQUE,   -- ex. tenant_<uuid>
  display_phone      text,
  risk_accepted_at   timestamptz,            -- QR só depois
  waba_id            text,                   -- reserva Cloud API
  phone_number_id    text,
  access_token_ref   text,
  status             text NOT NULL DEFAULT 'PENDING',  -- PENDING|CONNECTED|ERROR|DISCONNECTED
  kill_switch        boolean NOT NULL DEFAULT false,
  last_error         text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE message_template (
  id            uuid PRIMARY KEY,
  tenant_id     uuid,                        -- NULL = catálogo da plataforma
  key           text NOT NULL,               -- appointment_confirmation|reminder_24h|reminder_2h|…
  category      text NOT NULL,               -- UTILITY|MARKETING
  language      text NOT NULL DEFAULT 'pt_BR',
  body          text NOT NULL,               -- variáveis {{customerName}}, {{startsAtLocal}}
  variables     jsonb NOT NULL DEFAULT '[]',
  status        text NOT NULL DEFAULT 'ACTIVE',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE automation (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL,
  key         text NOT NULL,                 -- CONFIRMATION|REMINDER_24H|REMINDER_2H
  enabled     boolean NOT NULL DEFAULT true,
  config      jsonb NOT NULL,                -- {offsetHours, sendWindow, templateKey}
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

CREATE TABLE automation_run (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  automation_id   uuid NOT NULL REFERENCES automation(id),
  target_type     text NOT NULL,             -- APPOINTMENT
  target_id       uuid NOT NULL,
  scheduled_for   timestamptz NOT NULL,
  executed_at     timestamptz,
  result          text,                      -- SENT|SKIPPED_NO_CONSENT|SKIPPED_DISCONNECTED|SKIPPED_CANCELLED|FAILED
  notification_id uuid,
  UNIQUE (tenant_id, automation_id, target_type, target_id)
);

CREATE TABLE notification (
  id                   uuid PRIMARY KEY,
  tenant_id            uuid NOT NULL,
  location_id          uuid REFERENCES location(id),
  appointment_id       uuid REFERENCES appointment(id),
  customer_id          uuid REFERENCES customer(id),
  channel              text NOT NULL,        -- WHATSAPP|EMAIL
  provider             text NOT NULL,        -- waha|resend|cloud
  template_key         text NOT NULL,
  recipient            text NOT NULL,        -- E.164 ou e-mail
  scheduled_for        timestamptz,
  sent_at              timestamptz,
  status               text NOT NULL DEFAULT 'PENDING',  -- PENDING|SENT|FAILED|CANCELED
  provider_message_id  text,
  error                text,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_notification_provider_id
  ON notification (provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX idx_notification_due ON notification (status, scheduled_for);
```

Lookup de webhook WAHA: função `platform.resolve_whatsapp_account_by_session_name` (`SECURITY DEFINER`). Frontend **nunca** persiste `WAHA_API_KEY`.

## 7. Tabelas — platform e subscription

```sql
CREATE TABLE tenant_crypto_key (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES tenant(id),
  key_version   integer NOT NULL DEFAULT 1,
  algorithm     text NOT NULL DEFAULT 'AES-256-GCM',
  wrapped_dek   text NOT NULL,               -- DEK cifrada com KEK; nunca plaintext
  kek_provider  text NOT NULL DEFAULT 'local_vps',
  status        text NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE|ROTATING|RETIRED
  created_at    timestamptz NOT NULL DEFAULT now(),
  retired_at    timestamptz,
  UNIQUE (tenant_id, key_version)
);
CREATE UNIQUE INDEX uq_tenant_crypto_active
  ON tenant_crypto_key (tenant_id) WHERE status = 'ACTIVE';

CREATE TABLE outbox_event (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL,
  name          text NOT NULL,               -- scheduling.appointment_scheduled
  payload       jsonb NOT NULL,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  attempts      smallint NOT NULL DEFAULT 0,
  last_error    text
);
CREATE INDEX idx_outbox_pending ON outbox_event (processed_at, occurred_at) WHERE processed_at IS NULL;

CREATE TABLE audit_log (
  id             uuid PRIMARY KEY,
  tenant_id      uuid,                       -- NULL = ação de plataforma
  actor_user_id  uuid,
  actor_platform_admin_id uuid,
  actor_type     text NOT NULL,              -- USER|CUSTOMER|SYSTEM|SUPPORT
  action         text NOT NULL,
  resource_type  text NOT NULL,
  resource_id    uuid,
  customer_id    uuid,
  ip_address     inet,
  user_agent     text,
  metadata       jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_time ON audit_log (tenant_id, created_at DESC);

CREATE TABLE platform_audit_log (            -- break-glass / impersonation
  id                  uuid PRIMARY KEY,
  platform_admin_id   uuid NOT NULL REFERENCES platform_admin(id),
  tenant_id           uuid NOT NULL,
  action              text NOT NULL,         -- IMPERSONATE_START|IMPERSONATE_END|BILLING_STATUS
  reason              text NOT NULL,
  ip_address          inet,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE data_subject_request (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL,
  customer_id   uuid REFERENCES customer(id),
  type          text NOT NULL,               -- ACCESS|CORRECTION|DELETION|PORTABILITY|REVOKE_CONSENT
  status        text NOT NULL DEFAULT 'RECEIVED',
  requested_at  timestamptz NOT NULL DEFAULT now(),
  due_at        timestamptz NOT NULL,
  completed_at  timestamptz,
  handled_by    uuid,
  resolution    text,
  export_key    text
);

CREATE TABLE plan (
  id           uuid PRIMARY KEY,
  code         text NOT NULL UNIQUE,         -- SOLO|BARBEARIA|PRO|REDE
  name         text NOT NULL,
  price_cents  bigint NOT NULL,
  interval     text NOT NULL DEFAULT 'MONTHLY',
  limits       jsonb NOT NULL,               -- {professionals, locations}
  extra_location_cents bigint NOT NULL DEFAULT 3900,
  active       boolean NOT NULL DEFAULT true
);

CREATE TABLE plan_feature (
  plan_id  uuid NOT NULL REFERENCES plan(id),
  feature  text NOT NULL,                    -- WHATSAPP|CSV_EXPORT|NETWORK_REPORT
  enabled  boolean NOT NULL DEFAULT true,
  PRIMARY KEY (plan_id, feature)
);

CREATE TABLE subscription (
  id                        uuid PRIMARY KEY,
  tenant_id                 uuid NOT NULL UNIQUE REFERENCES tenant(id),
  plan_id                   uuid NOT NULL REFERENCES plan(id),
  status                    text NOT NULL,   -- TRIALING|ACTIVE|PAST_DUE|NEGOTIATING|SUSPENDED|CANCELED
  trial_ends_at             timestamptz,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  seats                     integer NOT NULL DEFAULT 1,
  locations_count           integer NOT NULL DEFAULT 1,
  grace_until               timestamptz,
  provider                  text NOT NULL DEFAULT 'manual',
  provider_customer_id      text,            -- reserva gateway (ADR-0010)
  provider_subscription_id  text,
  canceled_at               timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoice (
  id                  uuid PRIMARY KEY,
  tenant_id           uuid NOT NULL,
  subscription_id     uuid NOT NULL REFERENCES subscription(id),
  amount_cents        bigint NOT NULL,
  status              text NOT NULL,         -- DRAFT|ISSUED|PAID|VOID
  due_date            date,
  paid_at             timestamptz,
  provider_invoice_id text,
  notes               text,                  -- referência manual (Pix, comprovante)
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE usage_counter (
  tenant_id   uuid NOT NULL,
  metric      text NOT NULL,                 -- ACTIVE_STAFF|ACTIVE_LOCATIONS|MESSAGES_SENT
  period      text NOT NULL,                 -- '2026-08' | 'CURRENT'
  value       bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, metric, period)
);

CREATE TABLE webhook_event (
  id                 uuid PRIMARY KEY,
  provider           text NOT NULL,          -- waha|resend|stripe|…
  provider_event_id  text NOT NULL,
  payload            jsonb NOT NULL,
  processed_at       timestamptz,
  error              text,
  UNIQUE (provider, provider_event_id)
);
```

## 8. Views de leitura (`reporting`)

```sql
CREATE VIEW vw_appointment_completed_month
  WITH (security_invoker = true) AS
SELECT a.tenant_id, a.location_id, a.staff_id,
       date_trunc('month', a.starts_at) AS month,
       COUNT(*) AS completed_count,
       COALESCE(SUM(p.amount_cents) FILTER (WHERE p.reversed_at IS NULL), 0) AS received_cents
FROM appointment a
LEFT JOIN payment p ON p.appointment_id = a.id
WHERE a.status = 'COMPLETED'
GROUP BY 1, 2, 3, 4;

CREATE VIEW vw_no_show_rate
  WITH (security_invoker = true) AS
SELECT tenant_id, location_id, date_trunc('month', starts_at) AS month,
       COUNT(*) FILTER (WHERE status = 'NO_SHOW')::numeric
         / NULLIF(COUNT(*) FILTER (WHERE status IN ('COMPLETED', 'NO_SHOW')), 0) AS no_show_rate
FROM appointment
GROUP BY 1, 2, 3;
```

## 9. Regras de integridade que **não** ficam só na aplicação

| Regra | Mecanismo |
| --- | --- |
| Sem double-booking do profissional (qualquer unidade) | `EXCLUDE USING gist` |
| Uma unidade padrão por tenant | índice único parcial |
| Telefone único por tenant | índice único parcial |
| Isolamento entre tenants | RLS ([doc 06](./06-multi-tenancy.md)) |
| Idempotência de automação | `UNIQUE (tenant_id, automation_id, target_type, target_id)` |
| Idempotência de webhook | `UNIQUE (provider, provider_event_id)` |
| Uma DEK ACTIVE por tenant | índice único parcial |
| FKs compostas `(tenant_id, id)` | SQL na migração — impede referência cruzada |

## 10. Migrações

- Prisma Migrate em `backend/prisma/migrations`.
- RLS, `EXCLUDE`, generated columns, views, `citext`, `btree_gist`, `pg_trgm` = SQL manual na mesma migração.
- Extensões: `citext`, `btree_gist`, `pg_trgm`. UUID v7 na aplicação.
- Expand/contract: nunca `DROP COLUMN` no mesmo deploy que remove o uso.
- Seeds: `service_catalog_template` (Corte, Barba, Corte+Barba), planos, templates globais de mensagem, **2 tenants** (um com 2 unidades) no ambiente local.

## 11. Retenção e volumetria (500 tenants, ano 1)

| Tabela | Ordem de grandeza | Observação |
| --- | --- | --- |
| `appointment` | ~1,5 M | 500 × ~250/mês × 12 (barbearia é mais densa que clínica em slots curtos) |
| `notification` | ~4 M | 2–3 envios por agendamento |
| `audit_log` | ~20 M | particionar por mês; arquivar após 12 meses |
| `payment` | ~1,5 M | 1 pagamento típico por `COMPLETED` |
| `customer` | ~250 k | base da rede; não parte |

Anexos de foto (logo/cover/staff) no S3, não no banco. Sem prontuário/imagem clínica.

## 12. Envelope encryption — `tenant_crypto_key`

[ADR-0007](./adr/0007-criptografia-envelope-tenant.md), [ADR-0013](./adr/0013-kms-local-vps.md), [doc 17](./17-seguranca-baseline.md) §3.

Campos cifrados no MVP: `customer.notes`, `appointment.notes` (`text`, **não** `jsonb`).

Valor = Base64 de `version(1) || nonce(12) || ciphertext(N) || tag(16)`. AAD: `` `${tenantId}|${table}|${column}|${rowId}` ``. AES-256-GCM; DEK 32 bytes por tenant, só wrapped. Decrypt depois de RLS + RBAC. Trocar KEK = rewrap; trocar DEK = job (fase 2).

## Referências

- [06 — Multi-tenancy](./06-multi-tenancy.md)
- [08 — API v1](./08-api-v1.md)
- [15 — Glossário](./15-glossario.md)
- [16 — Estrutura de pastas](./16-estrutura-de-pastas.md)
- [ADR-0002](./adr/0002-multi-tenancy-rls.md) · [ADR-0007](./adr/0007-criptografia-envelope-tenant.md) · [ADR-0010](./adr/0010-billing-saas-manual-mvp.md) · [ADR-0016](./adr/0016-waha-default-messaging.md)
