# Progresso de desenvolvimento (log)

Append-only. Entradas mais recentes no topo.

---

## 2026-08-18 — S1 aceite local (API + Playwright)

### Feito

- `pnpm db:migrate` (4 migrações, nenhuma pendente) + `pnpm db:seed` (Navalha/Corte Fino já existiam — seeder passou a pular tenant existente)
- Smoke HTTP ampliado: GET users, PATCH location/service/staff, PUT staff locations/services, GET/DELETE time-blocks, GET onboarding
- `test:rls` · `test:identity` · `test:locations` verdes com `DATABASE_URL` de `app_user` (RLS)
- Playwright: seletor 1 vs 2 unidades, MANAGER, signup → wizard 4 passos → convite (`pnpm test:e2e`)
- `pnpm dev` no ar (API 3333 + web 3000)

### Validação

- Etapa 1 API: `test:rls` · `test:identity` · `test:locations` OK
- Etapa 2 e2e: 4 testes Playwright OK

### Nota

- Runtime da API no aceite usou `app_user`. Se `DATABASE_URL` no `.env` for o superuser/migrator, o RLS é bypassado e os testes de isolamento falham.

---

## 2026-08-18 — S1 Bloco 4 código (UI mínima Next.js)

### Feito

- Package `public`: signup, login real (substitui mock S0), forgot/reset, accept-invite, verify-email
- `api-client`: access em memória, refresh cookie + CSRF, `X-Location-Id`, retry 401
- Package `admin`: shell autenticado, seletor de unidade oculto se 1 ativa, cadastros (rede, unidades, horários/bloqueios, serviços, profissionais), equipe/convites
- Wizard 4 passos (horário → serviços → profissionais → publicar link/QR); copy da página pública na Sprint 4
- Nav esconde settings sem permissão (STAFF/RECEPTIONIST); API continua 403

### Validação

- `pnpm --filter @repo/frontend typecheck` · `pnpm --filter @repo/frontend lint`

### Próximo

- Aceite local ponta a ponta (signup → wizard → convite) e fechar S1

---

## 2026-08-18 — S1 Bloco 3 código (locations Must)

### Feito

- Perfil tenant + slug history 30 d; CRUD locations (uma `is_default`, timezone IANA, lead/horizon/cancel)
- `X-Location-Id` validado contra existência e `user_locations`; OWNER lista a rede
- Business hours (unidade/staff, weekday ISO, intervalos); time blocks pontual/RRULE com `conflicts[]` vazio
- Services CRUD + override `location_services`; staff + `staff_locations`/`staff_services` + convite via `identity_public`
- Wizard `GET|PATCH /tenant/onboarding`; `locations_public.getWorkingWindows`; `PlanLimitPort` trial ilimitado
- Smoke `pnpm test:locations` ampliado (M1 + signup/seletor/hours/staff/403)

### Validação

- `pnpm test:locations` · `pnpm test:identity` · `pnpm test:rls` · typecheck backend · lint · `pnpm arch:check` verdes localmente

### Próximo

- S1 Bloco 4 — UI mínima Next.js

---

## 2026-08-18 — S1 Bloco 2 código (convite, me, senha, e-mail)

### Feito

- Convite create/list/resend/revoke/accept (7 dias, papel + `location_ids`); e-mail SMTP (Mailpit) via `EmailPort`
- `GET /auth/me`, `GET /users`, `PATCH /users/:id` com proteção do último OWNER
- Forgot sempre 202; reset 1 h; verify-email no signup; tokens em `email_token` + RLS
- Audit: `MEMBER_INVITED`, `ROLE_CHANGED`, `PASSWORD_RESET`, `PERMISSION_DENIED` (STAFF em convite → 403)
- Smoke `pnpm test:identity` ampliado

### Validação

- `pnpm test:identity` · `pnpm test:rls` · `pnpm test:locations` · typecheck backend · lint · `pnpm arch:check` verdes localmente

### Próximo

- S1 Bloco 3 — locations Must (E2)

---

## 2026-08-18 — S1 Bloco 1 código (identity core)

### Feito

- Migração `identity_core`: `invitation`, `refresh_token_family`, `tenant_slug_history`, `service`, `business_hours` + RLS; lookup SECURITY DEFINER por e-mail/refresh
- Módulo `backend/src/modules/identity/`: signup atômico, login, refresh rotativo, logout, logout-all
- JWT sem `location_id` — escopo vem de `user_locations` a cada request; `authorize(permission)` + audit `PERMISSION_DENIED`
- Cookie refresh httpOnly (`SameSite=Lax`, path `/api/v1/auth`); reuso revoga a família
- Rate limit 5 falhas / 10 min por IP+e-mail; senha ≥ 10 + HIBP (não bloqueia se a API cair)
- Smoke `pnpm test:identity` no CI

### Validação

- `pnpm test:identity` · `pnpm test:rls` · `pnpm test:locations` · `pnpm test:kms` · typecheck backend · lint · `pnpm arch:check` verdes localmente

### Próximo

- S1 Bloco 2 — convite, me, senha, e-mail

---

## 2026-08-18 — S1 planejada (checklist)

### Feito

- Checklist [`sprints/S1-identidade-rede.md`](./sprints/S1-identidade-rede.md)
- Escopo: Must E1 + E2 + UI mínima; 4 blocos (3 backend + 1 frontend)
- Cortes: sem `membership`/switch-tenant; JWT sem `location_id`; STAFF×agenda → S3; `platform_admin` → S7; `conflicts[]` vazio até S2; `PlanLimitPort` trial ilimitado; página pública → S4

### Validação

- Fontes: RF E1/E2, módulos 01–02, docs/08 §2.1–2.2, herança S0

### Próximo

- S1 Bloco 1 — backend identity core (signup/login/refresh)

---

## 2026-08-18 — S0 código (aceite local)

### Feito

- Monorepo pnpm (`backend`, `frontend`, `contracts`) + Compose (Postgres 16, Redis, MinIO, Mailpit)
- Express `/health` `/ready`, env Zod, helmet/CORS/rate limit/requestId
- Prisma + RLS (`location`, `user`, `user_location`, `tenant_crypto_key`, `audit_log`, `outbox_event`)
- Seed Navalha (1 unidade) + Corte Fino (Centro/Jardim + MANAGER só Centro)
- Probe `GET /api/v1/locations/:id` (M1): A→B 404; gerente Centro→Jardim 404
- `KeyManagementPort` local + `test:kms`
- Next.js `/login` mock + shell `(app)`
- CI quality + integration; runbooks em `docs/desenvolvimento/runbooks/`

### Validação

- `pnpm test:kms` · `pnpm test:rls` · `pnpm test:locations` · `pnpm typecheck` · `pnpm arch:check` · `pnpm lint` verdes localmente

### Próximo

- Sprint 1 — signup/login/convite/RBAC + CRUD unidades
- Confirmar CI verde no GitHub após push

---

## 2026-08-18 — S0 planejada (checklist)

### Feito

- Pasta `docs/desenvolvimento/` (README, PROGRESSO, sprints)
- Checklist [`sprints/S0-fundacao.md`](./sprints/S0-fundacao.md): monorepo, Compose, Prisma+RLS, CI, `/health`, Next.js mock, KMS stub, seed 2 tenants (1 com 2 unidades), marco **M1**
- 6 blocos (5 backend + 1 frontend); cortes fechados (sem signup/login real; sem WAHA no compose; sem Dockerfiles EasyPanel)

### Validação

- Fontes: [docs/13](../13-roadmap-estimativas.md) S0/M1, [docs/17](../17-seguranca-baseline.md) §12, [docs/11](../11-infra-devops.md), [docs/16](../16-estrutura-de-pastas.md), RF-E9-01/02/03/10/11/13/18

### Próximo

- S0 Bloco 1 — monorepo pnpm + Docker Compose
