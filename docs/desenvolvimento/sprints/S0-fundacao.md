# Sprint 0 — Fundação técnica + segurança (E9 parcial)

**Objetivo verificável:** `pnpm dev` sobe API + web contra Compose; `/health` e `/ready` respondem; primeira migração aplica RLS; CI verde; seed com **2 tenants, um com 2 unidades**; suíte prova isolamento de tenant **e** de unidade. Marco **M1** no [docs/13](../../13-roadmap-estimativas.md).

**Escopo:** fundação (monorepo, Compose, Prisma+RLS, env Zod, middlewares, KMS stub, `audit_log`, Next.js layout + login **mockado**). Sem produto de agenda, signup real ou WhatsApp.  
**Pontos (roadmap):** ~30 · Épico E9 (parcial) · Marco M1 · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** documentação 01–17 + ADRs fechados. A S0 **não reabre** stack/provedores (Prisma, Hostinger, WAHA, Resend, billing manual, envelope).

**Estado (2026-08-18):** Sprint 0 **código entregue** (aceite local). CI GitHub confirma no primeiro push.

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — runtime, banco, isolamento, crypto stub (Blocos 1–4 e 6) | `backend/` |
| **Frontend** | Sim — shell Next.js + login mock (Bloco 5) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato compartilhado (`contracts/`).

### Backend (Blocos 1–4, 6)

- Workspaces pnpm, Compose, CI, `arch:check`
- Express `/health` + `/ready`; env Zod; middlewares de segurança
- Prisma + SQL de RLS; `TenantPrisma`; seed; testes de isolamento
- `KeyManagementPort` stub; `tenant_crypto_key`; esqueleto `audit_log`
- Probe HTTP mínimo para o M1 (`GET /locations/:id`)
- **Não inclui** signup, login/refresh, convite, RBAC completo
- **Não inclui** worker BullMQ em processo (tabela `outbox_event` pode existir; dispatcher é S1+)
- **Não inclui** adapter WAHA nem Resend real (Mailpit no Compose; `MESSAGING_PROVIDER=fake`)

### Frontend (Bloco 5)

- Next.js App Router, Tailwind, layout autenticado vazio, tela de login **mock**
- `shared/api` (cliente) apontando para `NEXT_PUBLIC_API_URL`
- Packages vazios (`operacional`, `admin`, `financeiro`, `messaging`, `public`) só como pastas
- **Não inclui** auth real, wizard, seletor de unidade, página pública de booking

---

## Fontes

| Doc | Uso |
| --- | --- |
| [13 — Roadmap S0 / M1](../../13-roadmap-estimativas.md) | Entregável e critério de saída |
| [17 §12 — Fundação na S0](../../17-seguranca-baseline.md) | Checklist de segurança |
| [11 — Infra](../../11-infra-devops.md) | Compose, env, CI, scripts |
| [05 — Arquitetura](../../05-arquitetura.md) | Monorepo, `shared/`, DI |
| [06 — Multi-tenancy](../../06-multi-tenancy.md) | RLS, `TenantPrisma`, dois níveis |
| [07 — Modelo §2 e §7](../../07-modelo-de-dados.md) | DDL `tenant`, `location`, `user`, `user_location`, `tenant_crypto_key`, `audit_log`, `outbox_event` |
| [08 — API `/health` `/ready`](../../08-api-v1.md) | Contrato HTTP da S0 |
| [09 — Frontend](../../09-frontend.md) | App Router, packages, api-client |
| [16 — Pastas](../../16-estrutura-de-pastas.md) | Orius, `arch:check`, nomenclatura |
| [RF E9](../../requisitos/funcionais/09-plataforma-lgpd.md) | RF-E9-01, 02, 03, 10, 11, 13, 18 (parcial) |
| [12 — Qualidade](../../12-qualidade-testes.md) | RLS + escopo de unidade no CI |
| [ADR-0002](../../adr/0002-multi-tenancy-rls.md) · [0004](../../adr/0004-orm-prisma.md) · [0007](../../adr/0007-criptografia-envelope-tenant.md) · [0011](../../adr/0011-uuid-v7-aplicacao.md) · [0013](../../adr/0013-kms-local-vps.md) | Não reabrir |

---

## Fora desta sprint

| Item | Quando |
| --- | --- |
| Signup, login/refresh, convite, recuperação de senha | S1 |
| CRUD unidades/serviços/staff/horários + wizard | S1 |
| Clientes, agenda, `EXCLUDE` | S2 |
| Página pública `/{tenant}/{location}` | S4 |
| WAHA / Resend de verdade | S5 |
| Billing SaaS, back-office, impersonation | S7 |
| Dockerfiles EasyPanel / TLS / S3 real | S8 (local usa MinIO) |
| Envelope nos campos `notes` (uso real) | S8 — S0 só o **port** |
| Playwright e2e de jornada | a partir da S1 (S0: smoke `/health` basta) |

---

## Decisões de corte (fechadas no planejamento)

1. **`location` entra no schema na S0** — nunca “loja única agora, rede depois”. UI de rede continua oculta até a S1; o modelo não espera.
2. **M1 exige HTTP 404**, não só teste de repositório. A S0 entrega um probe `GET /api/v1/locations/:id` (leitura do seed). Auth do probe = middleware de teste / JWT de fixture — **não** é o fluxo de login da S1.
3. **Tabelas da S0 (mínimo):** `tenant`, `location`, `"user"`, `user_location`, `tenant_crypto_key`, `audit_log`, `outbox_event`. Sem `invitation`, `refresh_token_family`, `service`, `staff`, `appointment`.
4. **Roles Postgres desde o init:** `app_migrator` (DDL) e `app_user` (`NOSUPERUSER` `NOBYPASSRLS`). Runtime nunca usa o superuser.
5. **Node 22 + pnpm 9** (workspaces `@repo/backend`, `@repo/frontend`, `@repo/contracts`).
6. **WAHA fora do Compose padrão.** Mailpit + MinIO + Redis + Postgres bastam.
7. **Login do frontend é fake** (submit não chama API). Evita acoplar UI a S1.
8. **`pnpm arch:check` (dependency-cruiser) na S0** — mesmo com poucos módulos, a regra já falha CI se `models/` importar Prisma/Express.

---

## Estado atual do código

Repositório ainda **sem** `backend/`, `frontend/`, `contracts/`, Compose ou CI. Tudo abaixo é entrega desta sprint.

**Entregar nesta sprint:** monorepo rodando local; migração RLS; seed M1; CI quality + integration; shell Next.js.

---

## Blocos de entrega

### Bloco 1 — Monorepo, Compose e scripts

- [x] `pnpm-workspace.yaml`: `backend`, `frontend`, `contracts`
- [x] `package.json` raiz: `dev`, `build`, `lint`, `typecheck`, `test`, `test:rls`, `test:kms`, `arch:check`, `db:migrate`, `db:seed`, `db:generate`
- [x] `docker-compose.yml`: Postgres 16, Redis 7, MinIO, Mailpit ([docs/11](../../11-infra-devops.md) §3)
- [x] `docker/postgres/init/01-roles.sql`: `app_migrator` + `app_user` (`NOBYPASSRLS`); DB `barbearia_dev`
- [x] `.env.example` (nunca `.env` no git); `.gitignore` de `node_modules`, `.env`, `dist`
- [x] `contracts/`: package `@repo/contracts` com envelope `{ data, error }` mínimo (`ApiResponse`, `ApiError`)

### Bloco 2 — Backend: runtime e segurança esqueleto

- [x] `backend/src/server.ts` · `app.ts` · `routes/index.ts` montando `/api/v1`
- [x] `shared/config/env.ts` — Zod; **app não sobe** se env inválido ([docs/11](../../11-infra-devops.md) §4)
- [x] `GET /api/v1/health` — liveness (RF-E9-10)
- [x] `GET /api/v1/ready` — Postgres + Redis (+ MinIO se configurado); 503 se dependência cair
- [x] Middlewares: `helmet`, CORS (`CORS_ORIGINS`), rate limit global brando, `requestId`, `errorHandler` (envelope estável, RF-E9-13)
- [x] Logger Pino JSON com `requestId` — **sem** senha, token, DEK (RF-E9-11)
- [x] `shared/domain/`: `TenantId`, `EntityId` (UUID v7 — ADR-0011), erros base (`NotFoundError` → 404)

### Bloco 3 — Backend: Prisma, RLS, seed, isolamento (M1)

- [x] `prisma/schema.prisma`: `Tenant`, `Location`, `User`, `UserLocation`, `TenantCryptoKey`, `AuditLog`, `OutboxEvent`
- [x] Migração SQL manual: `CREATE EXTENSION citext`; `platform.enable_tenant_rls(tabela)` em toda tabela com `tenant_id`; policy em `tenant` (`id = app.tenant_id`)
- [x] Trigger append-only em `audit_log` (bloqueia UPDATE/DELETE)
- [x] `shared/database/tenant-prisma.ts`: `SET LOCAL app.tenant_id` **e** (opcional S0) `app.user_id` na transação; hook/erro se query de negócio rodar sem contexto
- [x] Runtime Prisma usa `DATABASE_URL` (`app_user`); migrate usa `DATABASE_MIGRATION_URL`
- [x] Seed determinístico:

  | Tenant | Slug | Unidades | Usuários |
  | --- | --- | --- | --- |
  | A — Navalha | `navalha` | 1 (`default`) | OWNER |
  | B — Corte Fino | `corte-fino` | 2 (`centro`, `jardim`) | OWNER + MANAGER só de `centro` |

- [x] `pnpm test:rls` (Postgres do Compose ou Testcontainers):
  1. Tenant A **não** lê `location` / `user` do tenant B (`findUnique` → `null`)
  2. INSERT com `tenant_id` divergente do contexto → rejeitado pela policy
  3. Sem `SET LOCAL` → zero linhas (não dump)
  4. Inventário: toda tabela com coluna `tenant_id` tem RLS habilitada (RF-E9-18)
- [x] Probe HTTP autenticado por fixture: `GET /api/v1/locations/:id`
  1. User do tenant A no id de B → **404** (RF-E9-02)
  2. MANAGER de `centro` no id de `jardim` → **404** (RF-E9-03)
  3. OWNER de B lê as duas unidades
- [x] Helper `platform.audit.record` grava uma linha no seed/login-fake de teste (não precisa UI)

### Bloco 4 — Backend: `KeyManagementPort` + crypto stub

- [x] Port em `shared/crypto` (ou `types/ports/` do shared): `wrapDek` / `unwrapDek`
- [x] `LocalKeyManagementAdapter` com `TENANT_KEK` (dev: valor no `.env.example` **não** de produção)
- [x] Seed: gera DEK, wrap, persiste `tenant_crypto_key` para os 2 tenants
- [x] `pnpm test:kms`: wrap → unwrap round-trip; ciphertext diferente do plaintext
- [x] **Não** cifrar `customer.notes` / `appointment.notes` ainda (tabelas nem existem)

### Bloco 5 — Frontend: shell + login mock

- [x] Next.js App Router + TypeScript strict + Tailwind
- [x] `src/app/layout.tsx`, `error.tsx`, `not-found.tsx`
- [x] `src/app/(public)/login/page.tsx` — formulário visual; submit **não** chama API (copy: “login na S1”)
- [x] `src/app/(app)/page.tsx` — placeholder “Agenda (S3)”
- [x] `src/shared/api/api-client.ts` + `query-client.ts` (TanStack Query) — GET `/health` opcional na home de login para smoke
- [x] Pastas vazias dos packages (`operacional`, `admin`, `financeiro`, `messaging`, `public`) com `.gitkeep` ou README de 3 linhas
- [x] `NEXT_PUBLIC_API_URL` no `.env.example` do frontend

### Bloco 6 — CI, qualidade estática e runbooks

- [x] ESLint type-aware (backend + frontend)
- [x] `dependency-cruiser` (`pnpm arch:check`) — regras do [docs/16](../../16-estrutura-de-pastas.md) §1.8
- [x] `.github/workflows/ci.yml`: `quality` (lint, typecheck, arch, unit, gitleaks, `pnpm audit --audit-level=high`) + `integration` (migrate + `test:rls` + `test:kms`)
- [x] `.gitleaks.toml` (allowlist só do que for inevitável)
- [x] Runbooks mínimos em `docs/desenvolvimento/runbooks/`:
  - [x] `credencial-vazada.md`
  - [x] `suspeita-cross-tenant.md`
  - [x] `sessao-waha-caida.md` (procedimento mesmo sem WAHA no código: “alertar, fallback e-mail, não desligar agenda”)
- [ ] Confirmar CI verde no GitHub após o primeiro push da S0

---

## Aceite da sprint (DoD S0 / M1)

| # | Critério | Como provar |
| --- | --- | --- |
| 1 | Compose sobe; migrate + seed passam | `docker compose up -d` → `pnpm db:migrate` → `pnpm db:seed` |
| 2 | API viva | `GET /api/v1/health` 200; `/ready` 200 com Compose no ar |
| 3 | App não sobe com env inválido | tirar `DATABASE_URL` → process exit ≠ 0 |
| 4 | Isolamento tenant | `test:rls` verde; probe A→B = 404 |
| 5 | Isolamento unidade | probe MANAGER `centro` → `jardim` = 404 |
| 6 | Inventário RLS | teste falha se tabela nova com `tenant_id` não tiver policy |
| 7 | KMS stub | `test:kms` verde; seed tem `tenant_crypto_key` ACTIVE por tenant |
| 8 | Front mock | `/login` renderiza; layout `(app)` existe |
| 9 | CI | quality + integration verdes no PR |
| 10 | `arch:check` | verde; quebrar de propósito (Prisma em `models/`) falha |

**Fora do aceite S0:** login de verdade, wizard, agenda, WhatsApp, deploy EasyPanel.

---

## Paths e nomenclatura (S0)

```
backend/src/
  server.ts · app.ts · worker.ts          # worker.ts pode ser stub “not implemented”
  routes/index.ts
  shared/config/env.ts
  shared/database/prisma.ts · tenant-prisma.ts
  shared/middlewares/                     # helmet, cors, request-id, error-handler, rate-limit
  shared/crypto/                          # KeyManagementPort + LocalKeyManagementAdapter
  shared/domain/
  modules/locations/                      # probe GET location (Orius: get.service / get.repository / controller)
  modules/identity/                       # só o necessário para fixture de user no teste — CRUD fica S1
frontend/src/
  app/(public)/login/page.tsx
  app/(app)/page.tsx
  shared/api/
  packages/{operacional,admin,financeiro,messaging,public}/
contracts/src/
docker/postgres/init/01-roles.sql
.github/workflows/ci.yml
```

Classes curtas, arquivos `snake_case` no backend. Probe de location: `location_get.service.ts` / `GetService` — não inventar `LocationGetService`.

---

## Env (S0 — subset do docs/11)

Obrigatórios para subir: `NODE_ENV`, `PORT`, `DATABASE_URL`, `DATABASE_MIGRATION_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (par de fixture mesmo sem login), `CORS_ORIGINS`, `APP_PUBLIC_URL`, `STORAGE_*` (MinIO), `MAIL_DSN` (smtp Mailpit), `MESSAGING_PROVIDER=fake`.  
`TENANT_KEK` obrigatório em `production`; em `development`/`test` pode ter default documentado no `.env.example`.

---

## Bloqueios

_Nenhum no momento._

## Notas

- Se o volume do Postgres já existir sem roles: `docker compose down -v` e sobe de novo (init só no primeiro boot).
- Nome comercial do produto ainda não congelado; packages usam `@repo/*`.
- Domínios/TLS: EasyPanel ([ADR-0014](../../adr/0014-deploy-easypanel-dominios.md)) — Dockerfiles **depois**.
- Copiar estrutura de pastas do prontuário odontológico é **referência de stack**, não de domínio (não trazer `Patient`, `Unit`, `Chair`).
