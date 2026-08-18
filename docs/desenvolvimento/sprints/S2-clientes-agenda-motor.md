# Sprint 2 — Clientes e motor de agenda (E3 + E4 núcleo)

**Objetivo verificável:** API autenticada e pública criam clientes (E.164), calculam disponibilidade em SQL, criam/editam/cancelam agendamentos com snapshot de serviço, máquina de estados e constraint `EXCLUDE` anti-overbooking **por staff** (cross-unidade). 50 POSTs concorrentes no mesmo slot → exatamente 1 sucesso. `time_block.conflicts[]` passa a listar appointments reais.

**Escopo:** Must de E3 + núcleo de E4 (backend). Sem telas Next.js — UI do painel na S3; páginas `/{tenant}` na S4.  
**Pontos (roadmap):** ~45 · Épicos E3, E4 (núcleo) · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** [S1](./S1-identidade-rede.md) aceite local (identity + locations Must; smokes `test:identity` + `test:locations` + `test:rls` verdes).

**Estado (2026-08-18):** Sprint 2 **concluída** (Blocos 1–4 + smokes CI).

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — módulos `customers` + `scheduling` (Blocos 1–4) | `backend/` |
| **Frontend** | **Não** — nenhuma tela nova nesta sprint | — |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/` / `docs/08`).

### Backend (Blocos 1–4)

- DDL: `customer`, `appointment`, `appointment_service`, `appointment_history`; extensões `pg_trgm`, `btree_gist`; coluna gerada `period`; constraint `EXCLUDE`; RLS
- Módulo `customers`: CRUD, busca, upsert por telefone, histórico via scheduling
- Módulo `scheduling`: disponibilidade, CRUD painel, máquina de estados, rotas públicas de booking/cancelamento
- Integrações: `locations_public` (janelas/snapshot), `time_block.conflicts[]`, outbox na mesma TX
- Smokes `pnpm test:customers` + `pnpm test:scheduling` (inclui concorrência 50×)
- **Não inclui** UI agenda dia/semana, ficha de cliente no admin, pagamento, relatórios
- **Não inclui** dispatcher BullMQ / envio WhatsApp ou e-mail (eventos outbox só persistidos)
- **Não inclui** captcha visual na web (middleware API + honeypot no body já entram; widget é S4)

### Frontend

- **Nenhuma entrega nesta sprint.**
- S3: package `operacional` — agenda dia/semana, status, picker de cliente, ficha
- S4: package `public` — `/{tenant}`, `/{tenant}/{unidade}`, fluxo ≤ 4 telas

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E3](../../requisitos/funcionais/03-clientes.md) | Aceite clientes (Must, salvo cortes abaixo) |
| [RF E4](../../requisitos/funcionais/04-agenda.md) | Aceite motor de agenda (Must backend; UI → S3/S4) |
| [Módulo customers](../../modulos/03-clientes.md) | Invariantes, `getOrCreateByPhone`, anonimização |
| [Módulo scheduling](../../modulos/04-agenda.md) | Máquina de estados, `EXCLUDE`, disponibilidade |
| [API v1 §2.3–2.4](../../08-api-v1.md) | Contratos HTTP painel + público |
| [Modelo §3–4](../../07-modelo-de-dados.md) | DDL, índices, `EXCLUDE` |
| [12 — Qualidade §2.5](../../12-qualidade-testes.md) | Teste cross-unidade + 50 req concorrentes |
| [17 — Segurança §3.3](../../17-seguranca-baseline.md) | Envelope em `customer.notes` / `appointment.notes` |
| [Pastas](../../16-estrutura-de-pastas.md) | Módulos `customers` e `scheduling` |
| [S1](./S1-identidade-rede.md) | Herança: identity, locations, `getWorkingWindows` |

---

## Estado atual do código (herança S1)

Usar; **não** reimplementar.

| Já existe | Onde | Uso na S2 |
| --- | --- | --- |
| Auth, RBAC, `authorize(permission)` | `identity` | `customers.*`, `agenda.*`; STAFF filtrado por `staff_id` |
| `getWorkingWindows`, `getServiceSnapshot`, `staffServesLocation` | `locations_public` | Motor de disponibilidade |
| Business hours, time blocks, staff/services | `locations` | Interseção de janelas; conflitos de bloqueio |
| `time_block.conflicts[]` vazio | S1 | Preencher via `scheduling_public` |
| `KeyManagementPort` + `tenant_crypto_key` | S0 | Cifrar `notes` ao persistir (ADR-0007) |
| `outbox_event` (sem dispatcher) | S0 | `scheduling.appointment_*` na mesma TX do agendamento |
| Seed Navalha + Corte Fino | `prisma/seeders` | Ampliar com clientes/agendamentos de smoke |

**Entregar nesta sprint:** HTTP E3 + núcleo E4; tabelas novas + RLS; smokes de isolamento, cross-unidade e concorrência.

---

## Decisões de corte (fechadas no planejamento)

1. **Sem UI Next.js.** Painel (agenda/clientes) → **S3**; páginas públicas → **S4**. S2 entrega contrato HTTP consumível por curl/smoke.
2. **Mesma engine** para `GET /availability` autenticado e rota pública — uma implementação, dois entrypoints.
3. **`EXCLUDE` sem `location_id`.** Profissional não pode estar em dois lugares ao mesmo tempo, inclusive unidades diferentes ([ADR-0002](../../adr/0002-multi-tenancy-rls.md), doc 06).
4. **Status no painel:** API completa (`POST …/status`); telas de transição → **S3**. RF-E1-13 (STAFF só os próprios) aplicado **no servidor** já na S2 (`GET /appointments`, mutações).
5. **Outbox + jobs de mensagem (RF-E4-19):** eventos gravados na TX; **dispatcher e envio** → **S5**. Painel pode enviar `notifyCustomer: true` — fila ainda não processa.
6. **Pagamento no `COMPLETED` (RF-E4 + E5):** endpoints `POST /appointments/:id/payments` → **S6**.
7. **Envelope:** `customer.notes` e `appointment.notes` cifrados via `KeyManagementPort` ao gravar; leitura decifra só com permissão (`customers.read` / `agenda.read`).
8. **Anonimização LGPD completa (RF-E3-10):** `DELETE /customers/:id` = inativação (`active=false`, `deleted_at`); fluxo `data-subject-requests` → **S7/S9**.
9. **Público — rate limit + honeypot + captcha progressivo (RF-E4-17):** limites por IP e unidade na API; campo honeypot no POST; captcha só após N falhas (adapter stub aceitável até S4 ligar widget).
10. **Máx. 3 agendamentos futuros por telefone** na rota pública (RF-E4-18) — contagem no servidor.
11. **Sem OTP** no booking (RF-E4-26 Won't).
12. **`Idempotency-Key`** obrigatório em `POST /appointments` (painel e público) — dedupe 24 h por tenant.
13. **`cancel_token`:** UUID gerado no create; hash SHA-256 no banco; comparação em tempo constante; prazo `location.cancel_deadline_hours`.
14. **Drag-and-drop / remarcação visual (RF-E4-22 Should)** → **S3**.
15. **Polling / realtime agenda (RF-E4-21 Should)** → **S3**.

---

## Fora desta sprint

| Item | Quando |
| --- | --- |
| UI agenda dia/semana; login STAFF cai na agenda | S3 |
| Ficha/lista de clientes no admin | S3 |
| Páginas `/{tenant}` e `/{tenant}/{unidade}` (Next.js) | S4 |
| Confirmação/lembrete WhatsApp ou e-mail | S5 |
| Pagamento, comissão, relatórios | S6 |
| Billing SaaS, back-office LGPD completo | S7 |
| Endurecimento envelope (auditoria consultável) | S8 |

---

## Blocos de entrega

### Bloco 1 — Backend: customers (E3 Must)

- [x] Migração: `customer` + índices `uq_customer_phone`, `idx_customer_name_trgm`, `idx_customer_phone`; extensão `pg_trgm`; RLS/`enable_tenant_rls`
- [x] Módulo `backend/src/modules/customers/` (Orius: 1 op = 1 service/repository)
- [x] Normalização/validação E.164 na borda (Zod); telefone inválido → 422 claro (RF-E3-12)
- [x] `POST /customers`, `GET /customers` (search nome parcial + telefone), `GET/PATCH/DELETE /customers/:id`
- [x] `GET /customers/check-duplicate?phone=`; unicidade `(tenant_id, phone)` ativo (RF-E3-02)
- [x] `GET /customers/:id/appointments` — histórico com unidade, profissional, serviços, valor (RF-E3-06); total gasto quando houver pagamentos (stub 0 até S6)
- [x] `first_location_id` imutável no create (RF-E3-11); base única na rede (RF-E3-04)
- [x] `marketing_opt_in` separado; sem CPF (RF-E3-07)
- [x] `getOrCreateByPhone` em `customers_public.ts` (RF-E3-03) — usado pelo booking público e painel
- [x] Cifrar/decifrar `notes` via `KeyManagementPort`
- [x] Audit: `CUSTOMER_CREATED`, `CUSTOMER_UPDATED`, `CUSTOMER_DEACTIVATED`
- [x] Smoke `pnpm test:customers`

### Bloco 2 — Backend: scheduling DDL + domínio

- [x] Migração: `appointment`, `appointment_service`, `appointment_history`; coluna gerada `period tstzrange`; constraint `appointment_staff_no_overlap` (`EXCLUDE USING gist`); extensão `btree_gist`; índices docs/07; RLS
- [x] Módulo `backend/src/modules/scheduling/` — `models/appointment.model.ts` com máquina de estados (RF-E4-02, RF-E4-03)
- [x] Snapshot de preço/duração em `appointment_service` a partir de `locations_public.getServiceSnapshot` (RF-E4-08; fecha RF-E2-12)
- [x] `ends_at` e `total_price_cents` calculados no servidor; cliente **não** envia `endsAt`
- [x] `appointment_history` append-only (CREATED, RESCHEDULED, STATUS_CHANGED, CANCELLED)
- [x] Enums: `AppointmentStatus`, `AppointmentSource`, `CancelActor`
- [x] Erros de domínio: `InvalidStateTransitionError`, `SlotTakenError`, `TooLateToCancelError`, `HorizonExceededError`, `LeadTimeViolationError`

### Bloco 3 — Backend: disponibilidade + CRUD painel

| Área | RFs | Checklist |
| --- | --- | --- |
| `GET /availability` | E4-09, E4-10 | [x] |
| Janelas = unidade ∩ staff na unidade − blocks − appointments ativos do staff **em todas as unidades** | E4-09, US-07 | [x] |
| Lead time, horizonte (default 60 d), não passado | E4-10, E2-20 | [x] |
| `staffId` omitido = união de quem executa os `serviceIds` (`staff_services` vazio = todos) | módulo §4 | [x] |
| Timezone da **unidade** | E2-19 | [x] |
| `POST /appointments` com `Idempotency-Key` | doc 08 | [x] |
| `GET/PATCH/DELETE /appointments/:id`; `POST …/status`; `GET …/history` | E4-04 | [x] |
| Filtro `STAFF` → só `staff_id` próprio; escopo unidade → 404 fora do escopo | E1-13, E2-05 | [x] |
| `source`: `PUBLIC_PAGE`, `PANEL`, `PHONE`, `WALKIN` | E4-20 | [x] |
| Conflito → `409 SLOT_TAKEN` + `suggestedSlots` | E4-07 | [x] |
| Cross-unidade: mesmo staff, duas unidades, mesmo intervalo → 1 sucesso | doc 12 §2.5 | [x] |

- [x] `scheduling_public.ts`: `findActiveByStaffAcrossLocations`, `findConflictsForTimeBlock` (para locations)
- [x] Atualizar `time_block` create/list: `conflicts[]` com appointments sobrepostos (RF-E2-08)
- [x] Outbox na mesma TX: `scheduling.appointment_scheduled`, `rescheduled`, `cancelled`, `completed`, `no_show` (RF-E4-19 — persistir só; envio S5)
- [x] Smoke parcial `pnpm test:scheduling-panel` (aceite completo no Bloco 4)

### Bloco 4 — Backend: API pública + aceite

- [x] Rotas sem JWT (rate `public:booking:ip` + `public:booking:location`):
  - `GET /public/{tenantSlug}`
  - `GET /public/{tenantSlug}/{locationSlug}`
  - `GET …/availability`
  - `POST …/appointments`
  - `GET|PATCH|DELETE …/appointments/:id?token=`
- [x] `GET /public/{tenantSlug}`: unidades ativas com booking; slug inválido → 404
- [x] Sem serviço visível → 200 `bookingAvailable: false` (RF-E4-14)
- [x] Booking: `consentDataProcessing` obrigatório; `consentWhatsappMarketing` → `marketing_opt_in` (RF-E4-12)
- [x] Cliente criado via `customers_public.getOrCreateByPhone` se telefone novo (RF-E3-03)
- [x] Resposta 201 inclui `cancelToken` (plaintext uma vez); hash no banco
- [x] Cancelamento após prazo → `422 TOO_LATE_TO_CANCEL` (RF-E4-16)
- [x] GET por token: dados mascarados (RF-E4 transversal)
- [x] Máx. 3 futuros por telefone na rota pública (RF-E4-18)
- [x] Honeypot no body; captcha stub após N tentativas
- [x] Teste de carga: **50 POSTs concorrentes** no mesmo slot → exatamente 1 `201`, demais `409 SLOT_TAKEN`
- [x] Smoke `pnpm test:scheduling` (painel + público + cross-unidade + concorrência)
- [x] CI: acrescentar `test:customers` + `test:scheduling`; `test:rls` cobre tabelas novas

---

## Endpoints-alvo (docs/08)

### Painel (autenticado)

```
GET    /api/v1/customers                    ?search=&cursor=&limit=&active=
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id
GET    /api/v1/customers/:id/appointments
GET    /api/v1/customers/check-duplicate    ?phone=

GET    /api/v1/appointments                 ?from=&to=&staffId=&status=&locationId=
POST   /api/v1/appointments                 Idempotency-Key
GET    /api/v1/appointments/:id
PATCH  /api/v1/appointments/:id
POST   /api/v1/appointments/:id/status      { status, reason? }
DELETE /api/v1/appointments/:id             { reason }
GET    /api/v1/appointments/:id/history

GET    /api/v1/availability                 ?serviceIds=&staffId=&from=&to=&locationId=
```

### Público (sem JWT)

```
GET    /api/v1/public/{tenantSlug}
GET    /api/v1/public/{tenantSlug}/{locationSlug}
GET    /api/v1/public/{tenantSlug}/{locationSlug}/availability
POST   /api/v1/public/{tenantSlug}/{locationSlug}/appointments
GET    /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
PATCH  /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
DELETE /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
```

Envelope `{ data }` / `{ error }`; camelCase; `404` fora do tenant **ou** da unidade.

---

## Aceite da sprint (DoD S2)

| # | Critério | Como provar |
| --- | --- | --- |
| 1 | Cliente E.164 único por tenant | POST duplicado → 409; redes diferentes → OK |
| 2 | Upsert na reserva | POST público com telefone novo cria cliente + `first_location_id` |
| 3 | Disponibilidade correta | Slot respeita horário unidade, jornada staff, block e appointment em **outra** unidade |
| 4 | Snapshot | Preço/duração gravados em `appointment_service`; total coerente |
| 5 | Máquina de estados | Transição inválida → 409 `INVALID_STATE_TRANSITION` |
| 6 | Overbooking | 50 POSTs concorrentes → 1 sucesso; cross-unidade → 1 sucesso |
| 7 | STAFF isolado | STAFF A não vê/muta appointment de STAFF B (404 ou 403) |
| 8 | Unidade isolada | MANAGER Centro não vê appointment de Jardim (404) |
| 9 | Cancel token | Cancel público dentro do prazo OK; após prazo → 422 |
| 10 | Time block | POST time-block lista `conflicts[]` com appointments reais |
| 11 | Isolamento | `test:rls` + `test:customers` + `test:scheduling` no CI |
| 12 | Outbox | Create grava `scheduling.appointment_scheduled` na mesma TX |

**Fora do aceite S2:** telas Next.js, envio WhatsApp/e-mail, pagamento, LCP da página pública, drag-and-drop.

---

## Qualidade / CI

Acrescentar ao workflow da S1:

- `pnpm test:customers`
- `pnpm test:scheduling` (inclui teste 50× concorrência)
- `test:rls` continua obrigatório (`customer`, `appointment`, `appointment_service`, `appointment_history` com policy)
- p95 de `GET /availability` monitorado no smoke (meta MVP &lt; 500 ms — [docs/12](../../12-qualidade-testes.md))

---

## Paths (Orius)

```
backend/src/modules/customers/
  …/services/customer/customer_create.service.ts       # class CreateService
  …/services/customer/customer_upsert_by_phone.service.ts
  …/customers.module.ts
  …/customers_public.ts

backend/src/modules/scheduling/
  …/models/appointment.model.ts
  …/services/availability/availability_list.service.ts
  …/services/appointment/appointment_create.service.ts
  …/scheduling.module.ts
  …/scheduling_public.ts
```

Classes curtas **sem** prefixo da entidade. Cruzar módulos só por `*_public.ts` (`customers` ↔ `scheduling` ↔ `locations`).

---

## Bloqueios

_Nenhum no momento._

## Notas

- Disponibilidade: reutilizar `locations_public.getWorkingWindows`; appointments ativos consultados **sem** filtro de `location_id` (só `tenant_id` + `staff_id`).
- `23P01` do Postgres → mapear para `409 SLOT_TAKEN` (não vazar detalhe SQL).
- Idempotency: tabela ou Redis — seguir padrão existente em `shared/` se houver; senão tabela `idempotency_key` por tenant.
- Seed: incluir 2–3 clientes e 1 appointment por tenant para smoke manual; não usar PII real.
- Recrutamento de barbearias-piloto (roadmap §5): ideal fechar contato durante S2.
