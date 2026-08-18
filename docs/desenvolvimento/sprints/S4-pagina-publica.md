# Sprint 4 — Página pública (E4 público)

**Objetivo verificável:** cliente final marca horário pelo link da barbearia — `/{tenant}` (seletor ou redirect) e `/{tenant}/{unidade}` em ≤ 4 telas, sem login e sem OTP — e cancela/remarca com `cancel_token` até o prazo da unidade. LCP da página pública &lt; 2,5 s. Marco **M3** ([docs/13](../../13-roadmap-estimativas.md)).

**Escopo:** UI Must de E4 (público) no package `public` + rotas `(public)/[tenantSlug]`. Backend S2 consumido via HTTP; só gaps mínimos de DTO/slug/captcha.  
**Pontos (roadmap):** ~40 · Épico E4 (público) · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** [S3](./S3-agenda-painel.md) aceite local (e2e `s3-acceptance` verde; `test:customers` + `test:scheduling` + `test:rls` verdes).

**Estado (2026-08-18):** Sprint 4 **concluída** (Blocos 1–4).

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Pontual — DTO público + slugs reservados + captcha visível (Bloco 1) | `backend/` |
| **Frontend** | Sim — package `public` booking + rotas `(public)` (Blocos 2–4) | `frontend/` |
| **Contratos** | Sim — tipos/Zod do booking público (Bloco 1) | `contracts/` |

Não misturar: um bloco é **só backend/contratos** ou **só frontend**, salvo alinhamento de schema (`contracts/` ↔ `docs/08`).

### Backend (Bloco 1 — gaps)

API pública **já existe** na S2 (`GET/POST /api/v1/public/...`). Só o que a UI precisa e ainda não devolve:

- `GET /public/{tenantSlug}/{locationSlug}`: incluir `staff[]` (`id`, `name`) da unidade com `acceptsOnlineBooking`, sem PII extra
- `GET /public/{tenantSlug}`: incluir `name` (já tem) + `logoUrl` se existir no tenant — para LCP/marca
- Ampliar slugs reservados para não colidir com rotas Next (`agenda`, `clientes`, `inicio`, `configuracoes`, `forgot-password`, `reset-password`, `verify-email`, `accept-invite`, `agendamento`)
- Captcha: o stub S2 (`CAPTCHA_REQUIRED` após 5 falhas; token não-vazio) **permanece**; S4 liga o widget na UI — sem provedor externo no MVP

**Não inclui** dispatcher BullMQ, WAHA, pagamento, billing, `SUSPENDED` desliga página (→ S7).

### Frontend (Blocos 2–4)

- Package `public`: entidades de booking (além de Auth já na S1)
- Rotas: `/{tenantSlug}`, `/{tenantSlug}/{locationSlug}`, `/{tenantSlug}/{locationSlug}/agendamento/[id]?token=`
- Fluxo ≤ 4 telas, mobile-first, SSR leve, bundle **sem** `operacional` / `admin`
- Wizard S1: copy e QR passam a apontar para página real
- **Não inclui** confirmação/lembrete WhatsApp ou e-mail enviados (→ **S5**; tela de sucesso só)
- **Não inclui** pagamento antecipado, OTP, domínio próprio, Google Calendar

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E4](../../requisitos/funcionais/04-agenda.md) | Must público: RF-E4-11 a 18; fonte `PUBLIC_PAGE` (RF-E4-20) |
| [J2](../../03-personas-jornadas.md) | Agendamento sem login, ≤ 4 telas, token de cancelamento |
| [Módulo scheduling §5](../../modulos/04-agenda.md) | Token, rate limit, consentimento, máx. 3 futuros |
| [API v1 §2.4, §3.1](../../08-api-v1.md) | Contratos HTTP públicos já na S2 |
| [Frontend §4.2, §8](../../09-frontend.md) | UX pública, LCP, bundle sem painel |
| [RNF-PERF-04/05](../../requisitos/nao-funcionais/requisitos-nao-funcionais.md) | LCP &lt; 2,5 s; bundle mínimo |
| [RNF-SEC-09/20](../../requisitos/nao-funcionais/requisitos-nao-funcionais.md) | Rate limit, captcha, `cancel_token` |
| [Qualidade §2.9](../../12-qualidade-testes.md) | E2E fluxos 1 e 2 |
| [Pastas](../../16-estrutura-de-pastas.md) | Package `public`; `(public)/` |
| [UI shard 02](../../.cursor/docs/ui/02-anatomia-fluxos.md) | Fluxo / copy |
| [UI shard 04](../../.cursor/docs/ui/04-form-dialog.md) | Form de dados + consentimento |
| [UI shard 06](../../.cursor/docs/ui/06-select-estados.md) | Empty / loading / indisponível |
| [S2](./S2-clientes-agenda-motor.md) | Herança: API pública, honeypot, token, EXCLUDE |
| [S3](./S3-agenda-painel.md) | Herança: contratos painel, mapa de erros, timezone |

---

## Estado atual do código (herança S2 + S3)

Usar; **não** reimplementar regra no frontend.

| Já existe | Onde | Uso na S4 |
| --- | --- | --- |
| CRUD + disponibilidade públicos | `scheduling` API S2 | Wizard, grade, book, cancel/remarcar |
| `GET /public/{tenantSlug}` | 1 unidade vs N; `bookingAvailable` | Redirect ou seletor |
| `GET /public/{tenantSlug}/{locationSlug}` | serviços + `bookingAvailable` | Tela de unidade; **falta `staff[]`** |
| Honeypot `website` + captcha stub (5 falhas) | `public_booking_guard` | Campo oculto + widget após `CAPTCHA_REQUIRED` |
| `cancelToken` no 201; hash no banco | S2 | Página de cancelar/remarcar |
| Máx. 3 futuros / telefone; consentimento | S2 | Validação UX + erros 422 |
| Rate `public:booking:ip` e `:location` | rotas S2 | Sem duplicar no Next |
| Erros `SLOT_TAKEN`, `TOO_LATE_TO_CANCEL`, `CONSENT_REQUIRED`, `MAX_FUTURE_BOOKINGS`, `CAPTCHA_REQUIRED` | API S2 | Toast pt-BR |
| Wizard link/QR + copy “Sprint 4” | `WizardForm` | Trocar copy; URL já é `APP_PUBLIC_URL/{slug}` |
| Package `public` Auth | signup/login | **Não** misturar com booking; entidade nova |
| Slugs reservados parciais | `identity` / `locations` | Ampliar (Bloco 1) |
| Seed `/navalha` (1 unidade), `/corte-fino` (centro/jardim) | seeders | E2E e aceite manual |

**Entregar nesta sprint:** páginas públicas consumindo API S2; contratos tipados; e2e Playwright dos fluxos 1–2; marco **M3**.

---

## Decisões de corte (fechadas no planejamento)

1. **Backend mínimo.** Sem endpoint novo de produto. Gaps permitidos: `staff[]` e `logoUrl` no GET público; slugs reservados. Disponibilidade e book **não** mudam de regra.
2. **Cliente HTTP público.** Data de booking **não** envia `Authorization`, **não** dispara refresh e **não** manda `X-Location-Id`. Helper dedicado (`publicRequest` / flag no `api-client`) — o cliente autenticado do painel não pode vazar cookie/JWT para `/public`.
3. **SSR / LCP.** RSC carrega tenant/unidade (nome, logo, serviços) no Server Component do package — `page.tsx` continua fino. Availability e POST são Client + TanStack Query. Bundle da rota pública **não** importa `packages/operacional` nem `packages/admin`.
4. **≤ 4 telas (J2 / RF-E4-13):** (1) serviço(s) → (2) profissional ou “qualquer um” → (3) horário → (4) nome + telefone + consentimento. Confirmação é o **resultado** da tela 4, não uma quinta etapa. Cancelar/remarcar é fluxo separado (link do token).
5. **Sem OTP** (RF-E4-26 Won't). Sem conta do cliente final.
6. **Consentimento:** checkbox obrigatório — dados ficam com a **rede** (todas as unidades). Marketing opt-in **separado** e desmarcado por padrão. Sem `consentDataProcessing` → não POST; API devolve `CONSENT_REQUIRED` se burlar.
7. **Honeypot:** campo `website` hidden no POST (já validado na S2). Captcha visual **só** depois de `CAPTCHA_REQUIRED` (5 falhas). Sem Cloudflare/hCaptcha no MVP — stub aceita token não-vazio. Não bloqueia M3.
8. **Distância no seletor (RF-E4-11):** geolocalização do **browser** (`navigator.geolocation`); haversine com `lat/lng` da unidade. Sem Google Maps. Se o usuário negar, seletor segue com nome + endereço.
9. **Timezone:** slots e confirmação no timezone da **unidade** (`date-fns-tz`) — nunca `Date` local do aparelho para posicionar horário.
10. **`staffId` null** = “qualquer profissional” (API já escolhe quem executa os serviços). UI oferece essa opção explicitamente.
11. **`Idempotency-Key`:** UUID v7 no Data do POST público (mesmo helper da S3).
12. **Página de token:** `/{tenant}/{unidade}/agendamento/[id]?token=` — GET mascarado; PATCH remarcar; DELETE cancelar. Token inválido → 404 amigável (não vazar se o id existe). Após prazo → `TOO_LATE_TO_CANCEL`.
13. **`bookingAvailable: false`:** copy “Agendamento indisponível” (RF-E4-14) — HTTP 200, não 500, não empty genérico.
14. **Slug 404:** tenant/unidade inexistente → `not-found` do Next (não login).
15. **Wizard:** ao publicar, link e QR abrem a página real. Copy S1 (“página na Sprint 4”) sai.
16. **Mensagens S5:** tela de sucesso **não** promete WhatsApp. Copy: horário confirmado + como cancelar (token na resposta; persistir no `sessionStorage` da aba para o link local). Envio real → S5.
17. **`source=PUBLIC_PAGE`:** definido no servidor (S2); UI não envia origin inventada.
18. **Contratos:** `@repo/contracts` ganha tipos/Zod públicos; frontend e e2e importam daí — não redigitar DTOs.

---

## Fora desta sprint

| Item | Quando |
| --- | --- |
| Dispatcher BullMQ + WhatsApp/e-mail (confirmação e lembretes 24h/2h) | S5 |
| Pagamento, comissão, relatórios, CSV | S6 |
| `SUSPENDED` desliga página pública; trial/`PAST_DUE` ainda no ar | S7 |
| Provedor captcha de produção (Turnstile etc.) | S8 / ops |
| Inbox WhatsApp, Google Calendar, domínio próprio, OTP | Fase 2 |

---

## Blocos de entrega

### Bloco 1 — Contratos + gaps backend + cliente HTTP público

- [x] `contracts/`: `PublicTenant`, `PublicLocation`, `PublicLocationDetail` (serviços + `staff[]`), `PublicBook`, `PublicAppointmentCreated`, `PublicAppointmentMasked`, queries de availability pública, enums de erro estáveis
- [x] Backend: `staff[]` (`id`, `name`) no GET location público — só staff ativo da unidade com booking online
- [x] Backend: `logoUrl` no payload do tenant público (nullable)
- [x] Backend: slugs reservados alinhados às rotas Next (lista acima)
- [x] Frontend: request público sem JWT/refresh/`X-Location-Id`; `Idempotency-Key` no POST
- [x] Mapa `error.code` → pt-BR: `SLOT_TAKEN`, `TOO_LATE_TO_CANCEL`, `CONSENT_REQUIRED`, `MAX_FUTURE_BOOKINGS`, `CAPTCHA_REQUIRED`, `INVALID_CANCEL_TOKEN`, `LEAD_TIME_VIOLATION`, `HORIZON_EXCEEDED`
- [x] Data → Service → Hook no package `public` (`PublicTenant`, `PublicLocation`, `PublicAvailability`, `PublicAppointment`)

### Bloco 2 — Frontend: seletor + wizard ≤ 4 telas

| RF | Checklist |
| --- | --- |
| RF-E4-11 | [x] `/{tenantSlug}`: 1 unidade ativa com booking → redirect; N → seletor (nome, endereço, distância se geo ok) |
| RF-E4-12 | [x] `/{tenantSlug}/{locationSlug}`: serviços, profissionais, grade, book sem login |
| RF-E4-13 | [x] ≤ 4 telas; mobile-first (viewport 390px) |
| RF-E4-14 | [x] Sem serviço visível → “Agendamento indisponível” (200) |
| RF-E4-10 | [x] UI só mostra slots da API (lead/horizonte/passado já filtrados no servidor) |

- [x] Tela 1 — serviços visíveis (`visibleOnline`); preço/duração snapshotados da API
- [x] Tela 2 — profissionais da unidade **ou** “Qualquer profissional” (`staffId: null`)
- [x] Tela 3 — grade de slots (`GET …/availability`); timezone da unidade; vazio → empty state
- [x] RSC: nome da rede/unidade (e logo se houver) no HTML inicial
- [x] Slug inválido → `not-found`; não vazar existência via mensagem de auth

### Bloco 3 — Frontend: dados, confirmação, token, honeypot

| RF | Checklist |
| --- | --- |
| RF-E4-15 | [x] Página `…/agendamento/[id]?token=` — ver, remarcar, cancelar |
| RF-E4-16 | [x] Após prazo → copy de `TOO_LATE_TO_CANCEL` |
| RF-E4-17 | [x] Honeypot `website` no POST; captcha só se API exigir |
| RF-E4-18 | [x] `MAX_FUTURE_BOOKINGS` em toast/inline |

- [x] Tela 4 — nome, telefone E.164 (Zod), e-mail opcional, consentimento LGPD obrigatório, marketing opt-in separado
- [x] POST `PUBLIC_PAGE` via API; 201 mostra confirmação (serviço, profissional, horário local da unidade, total)
- [x] `409 SLOT_TAKEN` → toast + voltar à grade (suggestedSlots se a API mandar)
- [x] GET por token: telefone mascarado; sem notes
- [x] Wizard admin: remover copy “Sprint 4”; CTA abre o link real (nova aba)
- [x] `generateMetadata` com nome da unidade (SEO do link)

### Bloco 4 — Aceite: LCP, a11y, e2e

- [x] Playwright `frontend/e2e/s4-acceptance.spec.ts`:
  - Signup (ou seed) → wizard publicar → `/{tenant}` 200; loja única **sem** seletor (fluxo 1)
  - `/navalha` redireciona para a unidade; `/corte-fino` lista Centro e Jardim
  - Agendar na pública (nome + telefone + consentimento) → confirmação na tela (fluxo 2)
  - Appointment aparece na grade do painel com origem pública (smoke via API ou login OWNER)
  - `SLOT_TAKEN`: segundo book no mesmo slot → toast e grade atualizada
  - Cancelar com token válido; token inválido → 404 amigável
  - Unidade sem serviço visível → “Agendamento indisponível”
- [x] axe-core nas rotas `/navalha`, `/corte-fino`, `/corte-fino/centro` — zero violação crítica
- [x] LCP: RSC com nome visível no HTML; job CI ou script Lighthouse em `/navalha` (meta &lt; 2,5 s; se o runner não simular 4G, documentar medição local)
- [x] `pnpm --filter @repo/frontend typecheck` + lint; smokes S2 seguem verdes
- [x] Job CI `e2e-s4` (API + web + seed), no mesmo espírito do `e2e-s3`

---

## Endpoints consumidos (docs/08 — já na S2)

Nenhum path REST novo. Frontend público consome:

```
GET    /api/v1/public/{tenantSlug}
GET    /api/v1/public/{tenantSlug}/{locationSlug}
GET    /api/v1/public/{tenantSlug}/{locationSlug}/availability   ?serviceIds=&staffId=&from=&to=
POST   /api/v1/public/{tenantSlug}/{locationSlug}/appointments   Idempotency-Key
GET    /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
PATCH  /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
DELETE /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
```

Body do POST (espelho docs/08 §3.1): `serviceIds`, `staffId` (uuid ou null), `startsAt`, `customer.{name,phone,email?}`, `consentDataProcessing`, `consentWhatsappMarketing`, `website?` (honeypot), `captchaToken?`.

**Sem** `Authorization`. **Sem** `X-Location-Id` (slug resolve a unidade).

---

## Aceite da sprint (DoD S4 · Marco M3)

| # | Critério | Como provar |
| --- | --- | --- |
| 1 | Loja única | `/navalha` redireciona; não mostra seletor |
| 2 | Rede | `/corte-fino` lista Centro e Jardim (nome + endereço) |
| 3 | Book | Cliente agenda em ≤ 4 telas (serviço → staff → slot → dados) e vê confirmação |
| 4 | Sem login | Fluxo completo sem JWT; Auth do painel não interfere |
| 5 | Conflito | Dois POSTs no mesmo slot → 1 sucesso; UI trata `SLOT_TAKEN` |
| 6 | Indisponível | Unidade sem serviço visível → copy amigável, HTTP 200 da API |
| 7 | Token | Cancelar/remarcar com token válido; inválido → 404; tarde → 422 |
| 8 | Consentimento | Sem checkbox LGPD o POST não sai; marketing separado |
| 9 | Painel | OWNER vê o horário criado pela pública na grade (S3) |
| 10 | LCP / bundle | Nome da unidade no HTML inicial; rota pública sem import do painel |
| 11 | e2e | `s4-acceptance.spec.ts` verde localmente + CI |
| 12 | Sem regressão | `test:scheduling` + `test:customers` + `test:rls` + `s3-acceptance` seguem verdes |

**Fora do aceite S4:** WhatsApp/e-mail enviados, pagamento, página off em `SUSPENDED`, captcha de terceiros, Lighthouse 4G em todo PR se o runner não permitir.

---

## Qualidade / CI

- Manter smokes S2 + e2e S3
- Acrescentar job `e2e-s4` (stack: API + web + seed)
- axe-core nas rotas públicas
- Opcional: Lighthouse CI em `/navalha` (throttling 4G se disponível)

Meta UX ([docs/09](../../09-frontend.md)): LCP &lt; 2,5 s; bundle público sem agenda/clientes do painel.

---

## Paths (Orius)

```
contracts/src/
  public_booking.ts          # tipos + Zod públicos

backend/src/modules/locations/
  types/location/location_public.types.ts   # + staff[], logoUrl
  helpers/slug.ts / identity/.../tenant_slug.ts

frontend/src/packages/public/
  components/Booking/PublicTenantIndex.tsx
  components/Booking/PublicLocationPicker.tsx
  components/Booking/PublicBookingWizard.tsx
  components/Booking/PublicBookingConfirm.tsx
  components/Booking/PublicAppointmentManage.tsx
  data/Booking/PublicTenantGetData.ts
  data/Booking/PublicLocationGetData.ts
  data/Booking/PublicAvailabilityListData.ts
  data/Booking/PublicAppointmentCreateData.ts
  hooks/Booking/usePublicAvailabilityListHook.ts
  …

frontend/src/app/(public)/
  [tenantSlug]/page.tsx
  [tenantSlug]/[locationSlug]/page.tsx
  [tenantSlug]/[locationSlug]/agendamento/[id]/page.tsx

frontend/e2e/s4-acceptance.spec.ts
```

Fluxo: `Page → Component → Hook → Service → Data → API`. Package `public` **não** importa `operacional` nem `admin`. Auth (S1) e Booking (S4) convivem no mesmo package, entidades separadas.

Rotas estáticas (`/login`, `/signup`, `/agenda`, `/clientes`, …) prevalecem sobre `[tenantSlug]`; slugs iguais no banco são rejeitados no Bloco 1.

---

## Bloqueios

_Nenhum no momento._

## Notas

- Seed: `/navalha` (1 unidade `default`) e `/corte-fino/centro` + `/corte-fino/jardim`.
- Distância é nice-to-have do seletor — nome + endereço já cumprem o Must se geo falhar.
- Recrutamento piloto (roadmap §5): link público real é o artefato para o Instagram/QR da barbearia; métrica `first_public_booking` pode esperar instrumentação em S5/S8.
- `SUSPENDED` → página off é aceite do fluxo 9 em [docs/12](../../12-qualidade-testes.md), não desta sprint.
