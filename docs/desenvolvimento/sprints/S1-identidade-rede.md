# Sprint 1 — Identidade, rede e cadastros (E1 + E2 Must)

**Objetivo verificável:** visitante cria a barbearia (signup) → entra (login/refresh) → convida a equipe → configura unidades, horários, serviços e profissionais na API e no Next.js. Loja única **não vê** seletor de unidade. Wizard ≤ 4 passos.

**Escopo:** Must de E1 + E2 + UI mínima dos mesmos fluxos.  
**Pontos (roadmap):** ~40 · Épicos E1, E2 · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** [S0](./S0-fundacao.md) código + aceite local (Compose, RLS, `GET /locations/:id` probe, login mock).

**Estado (2026-08-18):** Sprint 1 **concluída** (Blocos 1–4 + aceite local API + Playwright).

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — identity + locations Must (Blocos 1–3) | `backend/` |
| **Frontend** | Sim — UI mínima dos mesmos fluxos (Bloco 4) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/` / `docs/08`).

### Backend (Blocos 1–3)

- DDL restante: `invitation`, `refresh_token_family`, `tenant_slug_history`, `location_slug_history`, `service`, `location_service`, `staff`, `staff_location`, `staff_service`, `service_catalog_template`, `business_hours`, `time_block` (+ `onboarding` no `tenant`)
- Auth: signup atômico, login/refresh/logout/logout-all, verify-email, forgot/reset, convite, `me`, RBAC, `user_locations`
- Cadastros: tenant, locations, services, staff, horários, bloqueios, wizard
- E-mail transacional via SMTP (Mailpit local)
- **Não inclui** telas Next.js
- **Não inclui** agenda, clientes, página pública `/{tenant}`, WAHA, billing SaaS, `platform_admin`

### Frontend (Bloco 4)

- Package `public`: signup, login **real**, forgot/reset, accept invite, verify email
- Package `admin`: shell autenticado, seletor de unidade (oculto se 1), cadastros, membros/convites, wizard
- Access token em memória; refresh em cookie httpOnly; `X-Location-Id` no `api-client`
- **Não inclui** novos endpoints — consome Blocos 1–3
- **Não inclui** agenda, clientes, booking público, WhatsApp, financeiro

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E1](../../requisitos/funcionais/01-identidade-acesso.md) | Aceite identidade (Must, salvo cortes abaixo) |
| [RF E2](../../requisitos/funcionais/02-rede-unidades-cadastros.md) | Aceite rede/cadastros |
| [Módulo identity](../../modulos/01-identidade-acesso.md) | Papéis, `ROLE_PERMISSIONS`, invariantes |
| [Módulo locations](../../modulos/02-rede-unidades-cadastros.md) | Seeds, `getWorkingWindows`, invariantes |
| [API v1 §2.1–2.2](../../08-api-v1.md) | Contratos HTTP |
| [Modelo §2](../../07-modelo-de-dados.md) | DDL |
| [Frontend §3–4.3](../../09-frontend.md) | Token, seletor, wizard |
| [Pastas](../../16-estrutura-de-pastas.md) | Orius; módulos `identity` e `locations` |
| [S0](./S0-fundacao.md) | Herança: não reimplementar |

---

## Estado atual do código (herança S0)

Usar; **não** reimplementar.

| Já existe | Onde | Uso na S1 |
| --- | --- | --- |
| `tenant`, `location`, `"user"`, `user_location` + RLS | migração `init_rls` | Signup/login/CRUD estendem; probe `GET /locations/:id` vira o Get de verdade |
| `tenant_crypto_key` + `KeyManagementPort` | S0 | Signup gera DEK (já no seed; repetir no signup) |
| `audit_log` append-only + `writeAuditLog` | S0 | LOGIN, falha, logout, reset, convite, papel, `PERMISSION_DENIED` |
| `outbox_event` (sem dispatcher) | S0 | `identity.tenant_created` na mesma TX; e-mail de convite/reset pode ir **sync** pelo `EmailPort` nesta sprint |
| `authenticate` + `tenantContext` (JWT fixture) | S0 | Trocar fixture por login real; **escopo de unidade vem do banco** (`user_locations`), não do token |
| Argon2id, jose, Mailpit, MinIO | S0 | Senha, JWT, SMTP, logo opcional |
| Login mock | `frontend` `(public)/login` | Substituir por auth real |
| Seed Navalha + Corte Fino | `prisma/seeders` | Completar com senha hash, convite de teste, serviços/horários; manter 2 tenants / 2 unidades |

**Entregar nesta sprint:** HTTP E1+E2; tabelas que faltam + RLS; UI mínima ponta a ponta.

---

## Decisões de corte (fechadas no planejamento)

1. **Sem tabela `membership`.** Um `user` = um tenant + `role` na linha (RF-E1-17). Sem `POST /auth/switch-tenant`.
2. **JWT (docs/08):** `sub`, `tenantId`, `role`, `staffId?`. **`location_id` não vai no token.** `tenantContext` carrega `user_locations` (OWNER = `ALL`) a cada request. O JWT de fixture da S0 (com `locationIds`) é substituído.
3. **RF-E1-13** (STAFF só os próprios agendamentos) → **S3**. Sem `appointment` nesta sprint. `staff_id` no JWT quando o user tiver `staff.user_id`.
4. **RF-E1-18** (`platform_admin` + MFA) → **S7**. Sem login de plataforma.
5. **RF-E2-08** (bloqueio lista conflitos de agenda): contrato `conflicts[]` **entra**. Sem appointments, a lista sai **vazia**; S2 preenche via `scheduling_public` / query.
6. **RF-E2-12** (snapshot de preço): catálogo não escreve em `appointment_services` (tabela ainda não existe). Nada a retroagir.
7. **Limite de plano (`402 PLAN_LIMIT_EXCEEDED`):** port `PlanLimitPort` com adapter **trial ilimitado** (S1). S7 liga limites reais. Path HTTP e código de erro já existem.
8. **Wizard “publicar”:** mostra `/{tenantSlug}` e `/{tenantSlug}/{locationSlug}` + QR. A **página pública** é S4 — o link pode 404 até lá; copy: “página de agendamento na Sprint 4”.
9. **E-mail:** adapter SMTP (Mailpit). Resend só se `RESEND_API_KEY` estiver setado. Sem inbox.
10. **Foto/logo:** `logoUrl` / `photoUrl` no PATCH (URL). Upload pré-assinado MinIO é **Should** — se estourar tempo, URL manual basta.
11. **HIBP (senhas vazadas):** k-anonymity da API Have I Been Pwned no signup/reset (timeout curto; se a API cair, **não** bloqueia o signup — log + segue).
12. **Worker BullMQ** continua stub. Convite/reset disparam e-mail na Action (sync). Dispatcher de outbox não é aceite S1.

---

## Fora desta sprint

| Item | Quando |
| --- | --- |
| Clientes, motor de agenda, `EXCLUDE` | S2 |
| UI agenda dia/semana; filtro STAFF | S3 |
| Página pública de booking | S4 |
| WAHA / templates | S5 |
| Pagamento no `COMPLETED`, relatórios | S6 |
| Billing SaaS, `platform_admin`, impersonation | S7 |
| Dockerfiles EasyPanel | S8 |

---

## Blocos de entrega

### Bloco 1 — Backend: identity core

- [x] Migração: `invitation`, `refresh_token_family`, `tenant_slug_history` (+ RLS/`enable_tenant_rls`); índices docs/07
- [x] Módulo `backend/src/modules/identity/` (Orius: 1 op = 1 service/repository)
- [x] `authorize(permission)` middleware (403 + `PERMISSION_DENIED` no audit)
- [x] Signup atômico (RF-E1-01..03): Tenant + Location `is_default` + User OWNER Argon2id + DEK + seeds horários (seg–sáb 09–19) + serviços CORTE/BARBA/CORTE_BARBA (preço 0) + `tenant.status=TRIALING` 14 d
- [x] E-mail duplicado → `409 DUPLICATE_RESOURCE` **sem** revelar tenant (RF-E1-02)
- [x] Login / refresh rotativo / logout / logout-all (RF-E1-04..07); cookie refresh httpOnly
- [x] Reuso de refresh → revoga família + audit (RF-E1-05)
- [x] Rate limit login 5 falhas / 10 min por IP+e-mail (RF-E1-06)
- [x] Senha ≥ 10 + HIBP; Argon2id

### Bloco 2 — Backend: convite, me, senha, e-mail

- [x] Convite create / list / resend / revoke / accept (RF-E1-10..11); papel + `location_ids`; 7 dias; e-mail Mailpit
- [x] `PATCH /users/:id` papel, unidades, ativo; último OWNER protegido (RF-E1-15)
- [x] `GET /auth/me` (RF-E1-16): user, role, locationIds (`ALL` se OWNER), permissions, staffId?
- [x] Forgot/reset senha: sempre 202 no forgot; token 1 h (RF-E1-08)
- [x] Verify e-mail no onboarding (RF-E1-09)
- [x] Matriz `ROLE_PERMISSIONS` do [módulo](../../modulos/01-identidade-acesso.md)
- [x] `audit_log`: LOGIN, LOGIN_FAILED, LOGOUT, PASSWORD_RESET, MEMBER_INVITED, ROLE_CHANGED, PERMISSION_DENIED
- [x] `EmailPort` + adapter SMTP; `identity_public.ts` (`getActor`, `authorize`)
- [x] Smoke `pnpm test:identity`

### Bloco 3 — Backend: locations (E2 Must)

| Área | RFs | Checklist |
| --- | --- | --- |
| Perfil tenant + slug + history 30 d | E2-01, E2-04 | [x] |
| CRUD locations; uma `is_default`; slug por tenant | E2-02, E2-03, E2-04 | [x] |
| `X-Location-Id` validado; OWNER vê rede | E2-05, E1-14 | [x] |
| Business hours (unidade e staff); weekday ISO | E2-06 | [x] |
| Time blocks pontual/RRULE; `conflicts[]` (vazio até S2) | E2-07, E2-08 | [x] |
| Services CRUD + seed signup + override `location_services` | E2-09..11 | [x] |
| Staff + `staff_locations` + `staff_services` + inativar | E2-13..16 | [x] |
| Timezone por unidade | E2-19 | [x] |
| Lead time / horizonte / cancel deadline (já no `location` S0) | E2-20 | [x] |
| Wizard API (passos + publicar = `onboarding` jsonb) | E2-17 | [x] |
| `getWorkingWindows` em `locations_public` | módulo §6 | [x] |
| `PlanLimitPort` stub (sempre ok) | E2 criar unidade/staff | [x] |

Módulo: `backend/src/modules/locations/` (já tem o Get probe — estender, não criar segundo Get).

- [x] Smoke `pnpm test:locations` (ampliar: signup, 404 unidade, seletor OWNER vs MANAGER, hours)

### Bloco 4 — Frontend: UI mínima

- [x] Package `public`: signup, login real (apaga mock), forgot/reset, accept invite, verify email
- [x] `api-client`: access em memória, refresh cookie, `X-Location-Id`, retry 401
- [x] Package `admin`: layout + seletor de unidade **oculto se 1 unidade ativa** (RF-E2-02)
- [x] Telas: tenant, unidades, horários, serviços, profissionais, membros/convites
- [x] Wizard 4 passos (horário → serviços → profissionais → publicar link/QR)
- [x] STAFF/RECEPTIONIST: sem itens de settings que a permissão nega (esconder na nav; API ainda 403)
- [x] Fluxo Page → Hook → Service → Data; pt-BR
- [x] Playwright **não** é aceite S1 no CI (opcional). Local: `pnpm test:e2e` (seletor + wizard + convite). CI: `test:identity` + `test:locations`

---

## Endpoints-alvo (docs/08)

```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/password/forgot
POST   /api/v1/auth/password/reset
POST   /api/v1/auth/verify-email
GET    /api/v1/auth/me

GET    /api/v1/users
POST   /api/v1/users/invitations
GET    /api/v1/users/invitations
DELETE /api/v1/users/invitations/:id
POST   /api/v1/users/invitations/accept
PATCH  /api/v1/users/:id

GET    /api/v1/tenant
PATCH  /api/v1/tenant
GET    /api/v1/tenant/slug-available?slug=

GET    /api/v1/locations
POST   /api/v1/locations
GET    /api/v1/locations/:id          # já existe (S0)
PATCH  /api/v1/locations/:id
GET    /api/v1/locations/:id/slug-available?slug=

GET    /api/v1/services
POST   /api/v1/services
PATCH  /api/v1/services/:id
PUT    /api/v1/locations/:id/services/:serviceId

GET    /api/v1/staff
POST   /api/v1/staff
PATCH  /api/v1/staff/:id
PUT    /api/v1/staff/:id/locations
PUT    /api/v1/staff/:id/services
POST   /api/v1/staff/:id/invite

GET    /api/v1/business-hours
PUT    /api/v1/business-hours

GET    /api/v1/time-blocks
POST   /api/v1/time-blocks
DELETE /api/v1/time-blocks/:id

GET|PATCH /api/v1/tenant/onboarding   # wizard (não está no mapa 08 — acrescentar no OpenAPI)
```

Envelope `{ data }` / `{ error }`; camelCase; `404` fora do tenant **ou** da unidade.

---

## Aceite da sprint (DoD S1)

| # | Critério | Como provar |
| --- | --- | --- |
| 1 | Signup atômico | 1 POST cria tenant + location default + OWNER + seeds; rollback se falhar |
| 2 | E-mail duplicado | `409` sem vazar se o e-mail é de outro tenant |
| 3 | Login + refresh + logout | cookie httpOnly; access 15 min; reuso de refresh revoga família |
| 4 | Convite | MANAGER Centro aceita → 404 em Jardim; OWNER lê os dois |
| 5 | Último OWNER | PATCH rebaixar / desativar → `422` / regra de negócio |
| 6 | Seletor | 1 unidade → UI sem seletor; 2 unidades → seletor só para quem tem escopo |
| 7 | Wizard | 4 passos; loja única não vê “adicionar unidade” no caminho feliz |
| 8 | Isolamento | `test:rls` + `test:identity` + `test:locations` no CI |
| 9 | Permissão | STAFF chama `POST /services` → 403 + audit |
| 10 | Front | signup → login → wizard → convite em local |

**Fora do aceite S1:** página pública 200, agenda, WhatsApp, limites de plano reais, MFA.

---

## Qualidade / CI

Acrescentar ao workflow da S0:

- `pnpm test:identity`
- `pnpm test:locations` (ampliado; o probe M1 permanece)
- `test:rls` continua obrigatório (tabelas novas com `tenant_id` precisam de policy)

---

## Paths (Orius)

```
backend/src/modules/identity/
  …/services/auth/auth_signup.service.ts     # class SignupService
  …/identity.module.ts
  …/identity_public.ts

backend/src/modules/locations/
  …/services/location/location_create.service.ts   # class CreateService
  …/locations_public.ts
  …/locations.module.ts          # já existe o Get; registrar create/list/update aqui
```

Classes curtas **sem** prefixo da entidade. Cruzar identity ↔ locations só por `*_public.ts`.

---

## Bloqueios

_Nenhum no momento._

## Notas

- Signup: `TenantPrisma.runProvisioning` para o `tenant`, depois `runInTenantContext` para location/user/seeds (mesmo padrão do seed S0).
- Palavras reservadas de slug: `admin`, `api`, `app`, `login`, `signup`, `health` (lista no módulo).
- Cookie refresh: `Secure` em production; `SameSite=Lax`; path `/api/v1/auth`.
- Carry-over explícito (não bloqueia S1): conflitos reais de `time_block` vs appointments (S2); UI de exceções ricas se o RRULE simples bastar.
