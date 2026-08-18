# Progresso de desenvolvimento (log)

Append-only. Entradas mais recentes no topo.

---

## 2026-08-18 — S4 encerrada · S5 planejada

### Feito

- S4 fechada: seção **Encerramento** + Marco **M3**; herança atualizada; link para S5
- Checklist [`sprints/S5-whatsapp-notificacoes.md`](./sprints/S5-whatsapp-notificacoes.md): E6, worker BullMQ, WAHA+Resend, UI QR, M4
- Roadmap §2 linka checklist S5; README desenvolvimento aponta S5 como fase atual

### Próximo

- S5 Bloco 1 — contratos + DDL + ports/adapters messaging

---

## 2026-08-18 — S4 Bloco 4 (aceite: smoke, vitest API, e2e Playwright)

### Feito

- Smoke `test:public-booking`: tenant navalha/corte-fino, staff[], token inválido, remarcar, SLOT_TAKEN, indisponível
- Vitest `public_booking.api.test.ts`: contratos GET/POST/PATCH/DELETE públicos (consent, honeypot, mascaramento)
- Playwright `s4-acceptance.spec.ts`: redirect, seletor, wizard 4 telas, painel, SLOT_TAKEN toast, token, indisponível, axe, RSC
- CI: integration + job `e2e-s4`; scripts `pnpm test:public-booking` e `pnpm test:e2e:s4`

### Validação

- smoke + vitest API (com DB seed); e2e S4 com stack local

### Próximo

- Sprint 5 — mensagens WhatsApp/e-mail

---

## 2026-08-18 — S4 Bloco 3 (dados, confirmação, token, honeypot)

### Feito

- Tela 4: nome, telefone E.164, e-mail opcional, LGPD obrigatório, marketing separado, honeypot `website`
- POST público → confirmação (serviço, profissional, horário no fuso da unidade, total); token no `sessionStorage` + link de gerenciar
- `SLOT_TAKEN` volta à grade; `MAX_FUTURE_BOOKINGS` toast/inline; captcha stub só após `CAPTCHA_REQUIRED`
- `/{tenant}/{unidade}/agendamento/[id]?token=`: ver (telefone mascarado), remarcar, cancelar; token inválido → 404; prazo → `TOO_LATE_TO_CANCEL`
- Wizard admin: copy Sprint 4 removida; CTA abre a página real em nova aba
- `generateMetadata` com nome da unidade nas rotas públicas (incluindo o token)

### Validação

- typecheck/lint frontend

### Próximo

- S4 Bloco 4 — e2e Playwright, axe, LCP, job CI `e2e-s4`

---

## 2026-08-18 — S4 Bloco 2 (seletor + wizard ≤ 4 telas)

### Feito

- `/{tenantSlug}`: 1 unidade → redirect; N → seletor (nome, endereço, distância via geolocalização)
- `/{tenantSlug}/{locationSlug}`: wizard serviço → profissional (ou qualquer um) → horários
- RSC com nome/logo no HTML; slug inválido → `not-found`; sem serviço → “Agendamento indisponível”
- Slots só da API, timezone da unidade; empty state se a grade vier vazia

### Validação

- typecheck/lint frontend

### Próximo

- S4 Bloco 3 — dados, confirmação, token, honeypot

---

## 2026-08-18 — S4 Bloco 1 (contratos + gaps públicos)

### Feito

- `@repo/contracts`: `PublicTenant`, `PublicLocation`/`Detail` (`staff[]`), `PublicBook`/`Reschedule`/`Cancel`, appointment criado/mascarado, erros estáveis
- GET público da unidade devolve `staff[]` (ativo + booking online na unidade); GET tenant devolve `logoUrl`
- Slugs reservados alinhados às rotas Next (`agenda`, `clientes`, `inicio`, …)
- `apiClient.requestPublic`: sem JWT, refresh, `X-Location-Id` ou cookie; `Idempotency-Key` no POST
- Package `public`: Data → Service → Hook (`PublicTenant`, `PublicLocation`, `PublicAvailability`, `PublicAppointment`)
- Mapa pt-BR: `MAX_FUTURE_BOOKINGS`, `CAPTCHA_REQUIRED`, `INVALID_CANCEL_TOKEN`

### Validação

- typecheck/lint contracts + backend + frontend; vitest slugs

### Próximo

- S4 Bloco 2 — seletor `/{tenant}` + wizard ≤ 4 telas

---

## 2026-08-18 — S4 planejada (checklist)

### Feito

- Checklist [`sprints/S4-pagina-publica.md`](./sprints/S4-pagina-publica.md)
- Escopo: UI Must E4 público (`/{tenant}`, `/{tenant}/{unidade}`, token); 4 blocos (1 contratos/gaps + 3 frontend); backend só DTO `staff[]`/`logoUrl` + slugs reservados
- Cortes: sem WhatsApp (S5); captcha visual só após `CAPTCHA_REQUIRED` (stub S2); geolocalização browser sem Maps; bundle sem painel; wizard S1 deixa de ser placeholder
- Marco **M3** (página pública no ar) como DoD
- S3 marcada concluída; roadmap §2 linka checklist S4

### Validação

- Fontes: RF-E4-11..18, J2, docs/09 §4.2, docs/08 §2.4/3.1, herança S2 (API pública) + S3 (erros/timezone)

### Próximo

- S4 Bloco 1 — contratos + gaps backend + cliente HTTP público

---

## 2026-08-18 — S3 Bloco 4 (aceite: nav, polish, e2e)

### Feito

- `/` é a agenda do dia para todos os papéis; OWNER com onboarding incompleto vê atalho **Configurar loja** (card + nav), sem redirect para `/inicio`
- `GET /auth/me` devolve `staffId` via `locations_public`; seed painel: STAFF `barbeiro@cortefino.local` (Carlos/Centro), Rafael (Centro), Diego (Jardim)
- Playwright `s3-acceptance.spec.ts`: create+status no painel, isolamento STAFF/MANAGER, busca/ficha, axe-core (zero crítica) em `/`, `/agenda`, `/clientes`
- Job CI `e2e-s3` (API + web + seed); wizard e2e entra na agenda e abre o atalho

### Validação

- typecheck/lint frontend + backend; e2e S3 no pipeline

### Próximo

- S4 — página pública `/{tenant}`

---

## 2026-08-18 — S3 Bloco 3 (UI agenda dia/semana)

### Feito

- `AppointmentIndex` + `AppointmentDayView` / `AppointmentWeekView` em `/` e `/agenda`
- Grade por profissional; STAFF vê só coluna própria; filtros data/status/profissional
- `AppointmentFormDialog` (create/update) com picker de cliente, serviços, availability
- Sidebar: detalhes, transições de status, cancelar, histórico; pagamento omitido (S6)
- Drag-and-drop remarcação com mutação otimista + rollback/toast em `SLOT_TAKEN`
- Polling 30 s + refetch on focus; timezone via `date-fns-tz` da unidade ativa
- Atalhos `n`, `←/→`, `t`, `Esc`

### Validação

- `pnpm --filter @repo/frontend typecheck` + lint verdes

### Próximo

- S3 Bloco 4 — nav polish, e2e, axe

---

## 2026-08-18 — S3 Bloco 2 (UI clientes)

### Feito

- `CustomerIndex`: busca nome/telefone, cursor (“Carregar mais”), empty/erro/skeleton
- `CustomerFormDialog` create/update: E.164 no Zod, `check-duplicate` no telefone, notes só com `customers.write`
- Ficha `/clientes/[id]`: histórico (unidade, profissional, serviços, valor) + total gasto da API
- `CustomerPicker` async para o form de agendamento (Bloco 3); inativação com copy LGPD (não “apagar”)

### Validação

- `pnpm --filter @repo/frontend typecheck` + lint verdes

### Próximo

- S3 Bloco 3 — agenda dia/semana no painel

---

## 2026-08-18 — S3 Bloco 1 (contratos + esqueleto operacional)

### Feito

- `@repo/contracts`: tipos + Zod + enums `Customer*`, `Appointment*`, `Availability*` (espelho docs/08 / API S2)
- `packages/operacional`: Data → Service → Hook para customers, appointments (CRUD + status + histórico) e availability
- `Idempotency-Key` UUID v7 no POST appointment; mapa `error.code` → pt-BR; `api-client` devolve `meta` e aceita 204
- Nav: Agenda (`agenda.read`) e Clientes (`customers.read`); seletor de unidade invalida `appointments` / `availability`

### Validação

- `pnpm --filter @repo/contracts build` + typecheck/lint frontend

### Próximo

- S3 Bloco 2 — UI clientes (index, ficha, picker, forms)

---

## 2026-08-18 — S3 planejada (checklist)

### Feito

- Checklist [`sprints/S3-agenda-painel.md`](./sprints/S3-agenda-painel.md)
- Escopo: UI Must E4 (painel) + E3 (lista/ficha); 4 blocos frontend + contratos; **sem backend novo**
- Cortes: pagamento → S6; página pública → S4; WhatsApp → S5; polling ≤ 30 s; drag-and-drop incluído
- Marco **M2** (agenda usável internamente) como DoD
- S2 marcada concluída; roadmap §2 linka checklist S3

### Validação

- Fontes: RF E3/E4 UI, docs/09 §4.1/4.4, docs/16 operacional, herança S2 (API customers + scheduling)

### Próximo

- S3 Bloco 1 — contratos + esqueleto `packages/operacional`

---

## 2026-08-18 — S2 concluída (aceite)

### Feito

- Blocos 1–4: customers, scheduling DDL, CRUD painel, API pública, smokes concorrência 50×
- CI: `test:customers` + `test:scheduling`; `test:rls` cobre tabelas novas
- Playwright `s2-acceptance.spec.ts` (API)

### Validação

- Smokes S2 verdes localmente

### Próximo

- Sprint 3 — agenda no painel (UI)

---

## 2026-08-18 — S2 Bloco 2 código (scheduling DDL + domínio)

### Feito

- Migração `scheduling_core`: `appointment`, `appointment_service`, `appointment_history`, coluna gerada `period`, `EXCLUDE` gist cross-unidade, RLS + grants
- Módulo `backend/src/modules/scheduling/`: máquina de estados, erros de domínio, `SlotCalculateService`, `PersistService`, histórico append-only
- Snapshots via `locations_public.getServiceSnapshot`; `ends_at`/`total_price_cents` calculados no servidor
- Check `pnpm test:scheduling-domain` (state machine + EXCLUDE + snapshots)

### Validação

- `pnpm test:scheduling-domain` · `pnpm test:rls` · `pnpm test:customers` · lint · arch:check verdes localmente

### Próximo

- S2 Bloco 3 — disponibilidade + CRUD painel

---

## 2026-08-18 — S2 Bloco 1 código (customers E3 Must)

### Feito

- Migração `customers_core` + `customers_grants`: tabela `customer`, `pg_trgm`, RLS, grants `app_user`
- Módulo `backend/src/modules/customers/`: CRUD, E.164, envelope em `notes`, `customers_public.getOrCreateByPhone`
- Endpoints docs/08 §2.3; histórico de appointments stub (lista vazia até Bloco 2)
- Audit `CUSTOMER_*`; smoke `pnpm test:customers`; CI atualizado

### Validação

- `pnpm test:customers` · `pnpm test:rls` · `pnpm test:identity` · `pnpm test:locations` · lint · arch:check verdes localmente

### Próximo

- S2 Bloco 2 — scheduling DDL + domínio

---

## 2026-08-18 — S2 planejada (checklist)

### Feito

- Checklist [`sprints/S2-clientes-agenda-motor.md`](./sprints/S2-clientes-agenda-motor.md)
- Escopo: Must E3 + núcleo E4 (backend); 4 blocos backend; **sem frontend** (UI → S3/S4)
- Cortes: mesma engine disponibilidade painel/público; `EXCLUDE` cross-unidade; outbox sem dispatcher; pagamento → S6; envelope em `notes`; `conflicts[]` real em time blocks

### Validação

- Fontes: RF E3/E4, módulos 03–04, docs/07 §3–4, docs/08 §2.3–2.4, herança S1 (`locations_public`, RBAC)

### Próximo

- S2 Bloco 1 — backend customers (DDL + CRUD + `customers_public`)

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
