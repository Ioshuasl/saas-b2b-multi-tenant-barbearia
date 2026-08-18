# Sprint 3 — Agenda no painel (E4 UI + E3 UI)

**Objetivo verificável:** dono/recepção operam o dia inteiro pelo painel — grade dia/semana, criar/editar/cancelar agendamento, transições de status, busca e ficha de cliente — sem caderno paralelo. Login **STAFF** cai na agenda do dia e vê **só** os próprios atendimentos. Marco **M2** ([docs/13](../../13-roadmap-estimativas.md)).

**Escopo:** UI Must de E4 (painel) + E3 (lista/ficha) no package `operacional`. Backend S2 consumido via HTTP; sem página pública.  
**Pontos (roadmap):** ~40 · Épicos E4 (UI), E3 (UI) · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** [S2](./S2-clientes-agenda-motor.md) aceite local (`test:customers` + `test:scheduling` + `test:rls` verdes; smokes painel e público OK).

**Estado (2026-08-18):** Sprint 3 **concluída** (Blocos 1–4 + e2e CI). Próxima: [S4](./S4-pagina-publica.md).

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | **Não** — nenhum endpoint novo; só correções pontuais se a UI expuser gap | `backend/` (exceção) |
| **Frontend** | Sim — package `operacional` + rotas `(app)` (Blocos 1–4) | `frontend/` |
| **Contratos** | Sim — tipos/Zod compartilhados customers + appointments (Bloco 1) | `contracts/` |

Não misturar: um bloco é **só backend/contratos** ou **só frontend**, salvo alinhamento de schema (`contracts/` ↔ `docs/08`).

### Backend

- **Nenhuma entrega obrigatória.** API E3 + E4 já entregues na S2.
- Correções permitidas: bug de contrato, mensagem de erro, performance de listagem — **sem** nova regra de domínio.
- **Não inclui** módulo `billing`, pagamentos, dispatcher outbox, rotas públicas Next.js, WAHA.

### Frontend (Blocos 1–4)

- Package `operacional`: `Customer`, `Appointment`, `Availability` (camadas Data → Service → Hook → Component)
- Rotas autenticadas: `/` (agenda do dia), `/agenda` (dia/semana), `/clientes`, `/clientes/[id]`
- Grade por profissional da unidade; status com ícone + texto; mutação otimista; polling ≤ 30 s
- STAFF: redirect pós-login para agenda; coluna única (próprio `staffId`)
- Customer picker no formulário de agendamento; ficha com histórico (`GET /customers/:id/appointments`)
- **Não inclui** booking público `/{tenant}` (→ **S4**)
- **Não inclui** modal funcional de pagamento (→ **S6**; ver corte abaixo)
- **Não inclui** relatórios, financeiro, WhatsApp QR, billing SaaS

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E4](../../requisitos/funcionais/04-agenda.md) | Must UI: RF-E4-01, 04, 05, 07; Should: RF-E4-21, 22 |
| [RF E3](../../requisitos/funcionais/03-clientes.md) | Must UI: RF-E3-05, 06, 09 |
| [Módulo scheduling](../../modulos/04-agenda.md) | Status, conflitos, timezone unidade |
| [Módulo customers](../../modulos/03-clientes.md) | Ficha, histórico cross-unidade |
| [API v1 §2.3–2.4](../../08-api-v1.md) | Contratos HTTP já implementados na S2 |
| [Frontend §4.1, §4.4](../../09-frontend.md) | UX agenda + clientes |
| [Qualidade §2.9](../../12-qualidade-testes.md) | E2E fluxos 3 e 6 (parcial nesta sprint) |
| [Pastas](../../16-estrutura-de-pastas.md) | Package `operacional`; exemplo `Customer` |
| [UI shard 05](../../.cursor/docs/ui/05-sidebar-details.md) | Ficha cliente / detalhe appointment |
| [UI shard 03](../../.cursor/docs/ui/03-crud-index-table.md) | Index clientes |
| [UI shard 04](../../.cursor/docs/ui/04-form-dialog.md) | `AppointmentFormDialog`, `CustomerFormDialog` |
| [S2](./S2-clientes-agenda-motor.md) | Herança: endpoints, erros, permissões |

---

## Estado atual do código (herança S2)

Usar; **não** reimplementar regra no frontend.

| Já existe | Onde | Uso na S3 |
| --- | --- | --- |
| CRUD customers + histórico appointments | `customers` API | Index, ficha, picker |
| CRUD appointments + status + history | `scheduling` API | Grade, sidebar, transições |
| `GET /availability` | `scheduling` API | Slots no form e remarcação |
| RBAC `agenda.*`, `customers.*`; STAFF filtrado | `identity` | Nav, colunas, mutações |
| `X-Location-Id` + seletor oculto (1 unidade) | `api-client` + S1 shell | Escopo de listagem |
| Shell autenticado, cadastros admin | `packages/admin` | Nav ganha Agenda + Clientes |
| Placeholder “Agenda (S3)” | `(app)/page.tsx`, `HomeIndex` | Substituir por grade real |
| Package `operacional` vazio | `frontend/src/packages/operacional/` | Implementar entidades |
| Erros estáveis (`SLOT_TAKEN`, etc.) | API S2 | Toast pt-BR via `ApiRequestError` |

**Entregar nesta sprint:** telas operacionais consumindo API S2; contratos tipados; e2e Playwright dos fluxos de painel; marco **M2**.

---

## Decisões de corte (fechadas no planejamento)

1. **Sem backend novo.** Se faltar campo na resposta, ajuste mínimo no mapper/DTO — não duplicar regra na UI.
2. **Pagamento ao `COMPLETED` (RF-E5-01):** **S6**, não S3. Na agenda, ao concluir, mostrar total snapshotado; botão “Registrar pagamento” **omitido** ou desabilitado com copy “Disponível em breve”. Roadmap §2 menciona pagamento na S3 — **prevalece** o corte S2/S6 (endpoint `POST /appointments/:id/payments` ainda não existe).
3. **Página pública `/{tenant}`:** **S4**. Wizard S1 continua só com link/QR estático.
4. **Confirmação/lembrete WhatsApp/e-mail:** jobs já na outbox (S2); envio real → **S5**. UI pode exibir badge “Notificação pendente” opcional, sem tela de messaging.
5. **Realtime:** polling TanStack Query **≤ 30 s** na grade (RF-E4-21 Should). SSE `/stream` só se sobrar tempo — **não bloqueia** aceite.
6. **Drag-and-drop remarcação (RF-E4-22 Should):** **incluído** na S3 com mutação otimista + rollback em `409 SLOT_TAKEN`.
7. **Login STAFF → `/` (agenda do dia),** não cadastros. OWNER/MANAGER/RECEPTIONIST → `/` ou última rota; default agenda do dia.
8. **Timezone:** renderizar com `date-fns-tz` usando timezone da **unidade ativa** — nunca `Date` local do browser para posicionar slot.
9. **Idempotency-Key:** header em `POST /appointments` gerado no Data layer (UUID v7); reutilizar helper em `shared/` se criado.
10. **Contratos:** ampliar `contracts/` com tipos de listagem/get/create appointment e customer alinhados a `docs/08` — frontend e smokes importam de `@repo/contracts`.
11. **Envelope `notes`:** exibir/editar só com `customers.write` / `agenda.write`; erro 403 → campo oculto.
12. **Total gasto na ficha (RF-E3-06):** exibir valor da API (stub 0 até S6) sem inventar cálculo no cliente.

---

## Fora desta sprint

| Item | Quando |
| --- | --- |
| Páginas públicas Next.js `/{tenant}`, `/{tenant}/{unidade}` | S4 |
| LCP &lt; 2,5 s, captcha visual, honeypot widget | S4 |
| Dispatcher BullMQ + WhatsApp/e-mail | S5 |
| Pagamento, comissão, relatórios, CSV | S6 |
| Billing SaaS, back-office LGPD | S7 |
| Inbox WhatsApp, Google Calendar | Fase 2 |

---

## Blocos de entrega

### Bloco 1 — Contratos + esqueleto `operacional`

- [x] `contracts/`: tipos + Zod para `Customer*`, `Appointment*`, `Availability*`, enums de status/source (espelho `docs/08`)
- [x] `packages/operacional/`: pastas por entidade (`Customer/`, `Appointment/`, `Availability/`) conforme [docs/16](../../16-estrutura-de-pastas.md)
- [x] Data layer: list/get/create/update/delete + `AppointmentStatusData`, `AvailabilityListData`
- [x] Service + Hook (TanStack Query) para cada operação; `queryKey` estável por unidade + intervalo de datas
- [x] Helper `Idempotency-Key` no POST appointment; mapa de `error.code` → mensagem pt-BR em `shared/` (estender se necessário)
- [x] Permissões na nav: `Can permission="agenda.read"` / `customers.read`

### Bloco 2 — Frontend: clientes (E3 UI)

| RF | Checklist |
| --- | --- |
| RF-E3-05 | [x] `CustomerIndex` + busca nome/telefone + paginação cursor |
| RF-E3-06 | [x] Ficha `/clientes/[id]`: histórico (unidade, prof, serviços, valor) + total gasto |
| RF-E3-09 | [x] Campo observações (notes) no form — respeita permissão |
| RF-E3-12 | [x] Validação Zod telefone E.164 no form (feedback antes do POST) |
| RF-E3-02 | [x] `check-duplicate` ao digitar telefone no create |

- [x] `CustomerFormDialog` (create/update); `CustomerTable` + columns
- [x] `CustomerPicker` (combobox/async) reutilizado no appointment form
- [x] Rota `app/(app)/clientes/page.tsx` + `clientes/[id]/page.tsx` — páginas finas
- [x] `DELETE` = confirmação + inativação (copy LGPD; não “apagar”)

### Bloco 3 — Frontend: agenda dia/semana (E4 UI)

| RF | Checklist |
| --- | --- |
| RF-E4-01 | [x] Visão **dia** (colunas por profissional) e **semana** (toggle ou rota `/agenda`) |
| RF-E4-04 | [x] Criar/editar/cancelar manual (PHONE/WALKIN/PANEL via `source`) |
| RF-E4-05 | [x] STAFF: só coluna própria; transições de status nos próprios |
| RF-E4-07 | [x] Conflito → toast + recarregar grade (`SLOT_TAKEN`) |
| RF-E4-21 | [x] Polling ≤ 30 s ou refetch on focus |
| RF-E4-22 | [x] Drag-and-drop remarcação com rollback |

- [x] `AppointmentIndex` / `AppointmentDayView` + `AppointmentWeekView` (virtualização na grade)
- [x] Cores/status: ícone + texto acessível (Agendado, Confirmado, Em atendimento, Concluído, No-show, Cancelado)
- [x] Clique slot vazio → `AppointmentFormDialog` (serviços, staff, cliente via picker, horário)
- [x] Clique card → painel lateral: detalhes, ações de status (`POST …/status`), cancelar, histórico
- [x] Atalhos teclado: `n`, `←/→`, `t`, `Esc` ([docs/09 §4.1](../../09-frontend.md))
- [x] Mobile-first: grade usável no celular do barbeiro (coluna única STAFF; swipe dia?)
- [x] `(app)/page.tsx` = agenda do dia; STAFF redirect pós-login
- [x] Filtros: data, status (opcional), profissional (OWNER/MANAGER; STAFF fixo)
- [x] Integração availability ao escolher serviço/staff/data no form

### Bloco 4 — Aceite: nav, polish, e2e

- [x] `AppNav`: links **Agenda** (`/`) e **Clientes** (`/clientes`) com `Can`
- [x] `HomeIndex`: OWNER com onboarding incompleto mantém atalho wizard; demais caem na agenda
- [x] Playwright `frontend/e2e/s3-acceptance.spec.ts`:
  - OWNER cria agendamento manual pelo painel → aparece na grade
  - Transição `SCHEDULED` → `CONFIRMED` → `IN_SERVICE` → `COMPLETED`
  - STAFF vê só próprios appointments (seed Corte Fino ou staff dedicado)
  - MANAGER Centro não vê appointment de Jardim (404 ou lista vazia)
  - Busca cliente + abre ficha com histórico
- [x] axe-core nas telas `/`, `/agenda`, `/clientes` — zero violação crítica
- [x] `pnpm --filter @repo/frontend typecheck` + lint no CI (já existente)

---

## Endpoints consumidos (docs/08 — já na S2)

Nenhum endpoint novo. Frontend consome:

### Clientes

```
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id
GET    /api/v1/customers/:id/appointments
GET    /api/v1/customers/check-duplicate?phone=
```

### Agenda (painel)

```
GET    /api/v1/appointments          ?from=&to=&staffId=&status=&locationId=
POST   /api/v1/appointments          Idempotency-Key
GET    /api/v1/appointments/:id
PATCH  /api/v1/appointments/:id
POST   /api/v1/appointments/:id/status
DELETE /api/v1/appointments/:id
GET    /api/v1/appointments/:id/history
GET    /api/v1/availability          ?serviceIds=&staffId=&from=&to=&locationId=
```

### Cadastros (já no admin — só leitura na agenda)

```
GET    /api/v1/staff
GET    /api/v1/services
```

Headers: `Authorization`, `X-Location-Id`, `Idempotency-Key` (POST appointment).

---

## Aceite da sprint (DoD S3 · Marco M2)

| # | Critério | Como provar |
| --- | --- | --- |
| 1 | Grade dia operável | OWNER cria appointment em slot livre; card aparece na coluna certa |
| 2 | Semana | Toggle/semana lista mesmos dados em layout semanal |
| 3 | Status | Fluxo até `COMPLETED` só via transições válidas; inválida → toast 409 |
| 4 | STAFF isolado | Login STAFF → só coluna própria; appointment de outro prof → invisível |
| 5 | Unidade isolada | MANAGER unidade A não vê cards da unidade B |
| 6 | Conflito UX | Simular `SLOT_TAKEN` → toast + grade atualizada |
| 7 | Clientes | Busca por telefone; ficha com histórico cross-unidade (mesma rede) |
| 8 | Remarcação | Drag-and-drop ou PATCH horário; rollback se 409 |
| 9 | Polling | Segundo usuário vê mudança de status em ≤ 30 s (ou refetch manual documentado) |
| 10 | Mobile | Grade legível em viewport 390px (STAFF) |
| 11 | e2e | `s3-acceptance.spec.ts` verde localmente + CI |
| 12 | Sem regressão S2 | `test:customers` + `test:scheduling` + `test:rls` continuam verdes |

**Fora do aceite S3:** booking público, pagamento registrado, lembrete WhatsApp enviado, relatório CSV, LCP página pública.

---

## Qualidade / CI

- Manter smokes S2 no CI (`test:customers`, `test:scheduling`, `test:rls`)
- Acrescentar job ou step: Playwright `s3-acceptance` (stack local: API + web + seed)
- Vitest: hooks de formatação de timezone/slot (opcional, alto valor)
- axe-core no pipeline e2e ou script dedicado

Meta UX ([docs/09](../../09-frontend.md)): TTI agenda &lt; 3 s; grade 60 fps com virtualização.

---

## Paths (Orius)

```
contracts/src/
  customer*.ts | appointment*.ts | availability*.ts   # tipos + Zod

frontend/src/packages/operacional/
  components/Appointment/AppointmentDayView.tsx
  components/Appointment/AppointmentFormDialog.tsx
  components/Customer/CustomerIndex.tsx
  components/Customer/CustomerPicker.tsx
  data/Appointment/AppointmentListData.ts
  hooks/Appointment/useAppointmentListHook.ts
  services/Customer/CustomerListService.ts
  types/Appointment/AppointmentTypes.ts
  schemas/Appointment/AppointmentSchema.ts

frontend/src/app/(app)/
  page.tsx                    # agenda do dia
  agenda/page.tsx             # dia/semana
  clientes/page.tsx
  clientes/[id]/page.tsx

frontend/e2e/s3-acceptance.spec.ts
```

Fluxo: `Page → Component → Hook → Service → Data → API`. Package `operacional` **não** importa de `admin` — compartilhar via `shared/` ou `contracts/`.

---

## Bloqueios

_Nenhum no momento._

## Notas

- Reutilizar padrões visuais de `packages/admin` (Table, FormDialog, PageHeader, `Can`).
- `staffId` do JWT (`me.staffId`) define coluna STAFF — não confiar em filtro só no cliente.
- Ao trocar unidade no seletor, invalidar queries `['appointments']` e `['availability']`.
- Total na ficha/histórico vem do backend; quando S6 ligar pagamentos, UI já exibe campo — sem refactor de layout.
- Recrutamento piloto (roadmap §5): ideal manter contato ativo durante S3 para feedback da grade.
