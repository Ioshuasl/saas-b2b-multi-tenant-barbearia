# Sprint 5 — WhatsApp e notificações (E6)

**Objetivo verificável:** após criar ou remarcar agendamento (painel ou página pública), o cliente recebe **confirmação** e **lembretes 24 h e 2 h** por WhatsApp (WAHA GOWS) **ou** e-mail (Resend/Mailpit fallback). OWNER conecta número dedicado com checkbox de ciência + QR; sessão caída **não** bloqueia agenda. Marco **M4** ([docs/13](../../13-roadmap-estimativas.md)).

**Escopo:** módulo `messaging` (backend + worker BullMQ) + package `messaging` (UI conexão/status) + dispatcher da outbox S2.  
**Pontos (roadmap):** ~35 · Épico E6 · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** [S4](./S4-pagina-publica.md) aceite local (`e2e-s4` verde; `test:public-booking` + `test:scheduling` + `s4-acceptance` verdes).

**Estado (2026-08-18):** Sprint 5 **planejada** — nenhum bloco iniciado.

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — módulo `messaging`, worker, DDL, ports/adapters (Blocos 1–2) | `backend/` |
| **Frontend** | Sim — conexão WAHA, banner de sessão, status de envio (Bloco 3) | `frontend/` |
| **Contratos** | Sim — tipos/Zod messaging + enums de status (Bloco 1) | `contracts/` |

Não misturar: um bloco é **só backend/contratos/worker** ou **só frontend**, salvo alinhamento de schema (`contracts/` ↔ `docs/08`).

### Backend (Blocos 1–2)

- DDL: `notification`, conta/sessão messaging (`risk_accepted_at`, status WAHA), fila de automações agendadas (24 h / 2 h)
- Ports: `MessagingProvider`, `EmailProvider` — casos de uso **não** importam WAHA/Resend direto
- Adapters: `FakeMessagingProvider` (`MESSAGING_PROVIDER=fake`, default CI/dev), `ResendEmailProvider` (ou Mailpit em dev), `WahaMessagingProvider` (GOWS)
- Worker BullMQ: consome `outbox_event` + jobs de lembrete; retry com backoff; idempotência
- Templates: `appointment_confirmation`, `reminder_24h`, `reminder_2h`, `appointment_cancelled`, `appointment_rescheduled` ([módulo §4](../../modulos/06-whatsapp-notificacoes.md))
- Webhook WAHA (HMAC) + normalização de status de entrega
- API §3.4 [docs/08](../../08-api-v1.md): `POST/GET/DELETE /messaging/account`, poll QR
- **Não inclui** inbox bidirecional, campanhas marketing em massa, SMS, Cloud API como default

### Frontend (Bloco 3)

- Package `messaging`: tela de configuração (OWNER) — checkbox ciência → QR/pairing → status `CONNECTED` / desconectado
- Banner global quando sessão cair ([docs/09 §4.5](../../09-frontend.md)); barbeiro continua agendando
- Copy **não** diz “WhatsApp oficial” ([ADR-0016](../../adr/0016-waha-default-messaging.md))
- Opcional Should: badge “Notificação pendente” na sidebar do appointment (S3) — **não bloqueia** M4
- **Não inclui** inbox 3 colunas, pagamento, relatórios, billing

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E6](../../requisitos/funcionais/06-whatsapp-notificacoes.md) | Must: RF-E6-01 a 15, 19 |
| [Módulo messaging](../../modulos/06-whatsapp-notificacoes.md) | Templates, automações, webhook |
| [ADR-0016](../../adr/0016-waha-default-messaging.md) | WAHA GOWS default; ciência + número dedicado |
| [API v1 §3.4](../../08-api-v1.md) | Contratos HTTP messaging |
| [Frontend §4.5, §8](../../09-frontend.md) | Tela QR; banner; package `messaging` |
| [Qualidade §2.9 fluxos 10–11](../../12-qualidade-testes.md) | E2E ciência + sessão caída |
| [Pastas](../../16-estrutura-de-pastas.md) | BC `messaging`; `worker.ts` |
| [Runbook WAHA](../../desenvolvimento/runbooks/sessao-waha-caida.md) | Fallback e kill switch |
| [S2](./S2-clientes-agenda-motor.md) | Outbox na TX; eventos `scheduling.appointment_*` |
| [S4](./S4-pagina-publica.md) | Book público dispara outbox; copy confirmação sem prometer WA |

---

## Estado atual do código (herança S2–S4)

Usar; **não** reimplementar regra de agendamento.

| Já existe | Onde | Uso na S5 |
| --- | --- | --- |
| Outbox `scheduling.appointment_scheduled` / `rescheduled` / `cancelled` / … | `scheduling` repos + TX | Dispatcher lê e enfileira envios |
| Payload outbox (`appointmentId`, `startsAt`, `customerId`, …) | `appointment_outbox.events.ts` | Montar template + link cancelamento |
| `OutboxEvent` (sem `processed_at` preenchido) | Prisma | Worker marca processado |
| `notifyCustomer` no POST painel (flag) | API S2 | Respeitar opt-out por request |
| `consentWhatsappMarketing` + `marketing_opt_in` cliente | customers + book público | RF-E6-12 marketing |
| `cancelToken` + URL pública | S2/S4 | Variável `{{cancelLink}}` nos templates |
| Worker stub | `backend/src/worker.ts` | Substituir por BullMQ + handlers |
| Package `messaging` vazio | `frontend/src/packages/messaging/` | Implementar UI |
| Módulo `messaging` backend | **Não existe** | Criar BC completo |
| Tabelas `notification` / conta WAHA | **Não existem** | Migration Bloco 1 |
| Env `MESSAGING_PROVIDER=fake` | Compose/CI | Dev e testes sem WAHA real |

**Entregar nesta sprint:** envio ponta a ponta confirmação + lembretes; fallback e-mail; UI QR; e2e fluxos 10–11; marco **M4**.

---

## Decisões de corte (fechadas no planejamento)

1. **Outbox S2 é a fonte de verdade.** Dispatcher **não** duplica evento no create — lê `outbox_event` (ou relay imediato pós-commit). Cancelar/remarcar **cancela** jobs pendentes do horário antigo (RF-E6-06).
2. **Default dev/CI: `MESSAGING_PROVIDER=fake`.** Logs + registro em `notifications`; sem WAHA no CI obrigatório. Piloto/staging usa WAHA real.
3. **E-mail fallback obrigatório.** Falha WAHA ou sessão `DISCONNECTED` → canal e-mail (Mailpit local, Resend prod). Agenda **sempre** funciona (RF-E6-03).
4. **Janela de silêncio 21h–8h** no fuso da **unidade**; lembretes fora da janela adiam para 8h (RF-E6-08).
5. **QR só após `riskAccepted: true`** persistido (`risk_accepted_at`). Sem aceite → 422 (RF-E6-10).
6. **Frontend nunca chama WAHA** — só API `/messaging/*` (RF-E6-15).
7. **Kill switch:** `DELETE /messaging/account` faz logout WAHA + desliga automações do tenant (RF-E6-19).
8. **Templates MVP:** cinco chaves fixas (módulo §4); variáveis renderizadas no adapter; pt-BR; link cancelamento com token.
9. **Lembretes 24 h e 2 h:** jobs agendados no BullMQ com `delay` calculado; recalcular em remarcar; cancelar em cancelamento.
10. **Página pública:** book S4 já grava outbox — S5 **não** muda contrato REST de booking; só processa eventos.
11. **Copy confirmação UI (S4):** pode passar a mencionar “você receberá confirmação por WhatsApp ou e-mail” **somente** quando S5 estiver ligado e tenant com canal configurado — evitar promessa vazia no MVP inicial.
12. **Contratos:** `@repo/contracts` para DTOs messaging; frontend/worker importam daí.

---

## Fora desta sprint

| Item | Quando |
| --- | --- |
| Inbox WhatsApp bidirecional (RF-E6-16) | Fase 2 |
| Campanhas marketing em massa (RF-E6-17) | Won't MVP |
| SMS canal principal (RF-E6-18) | Fase 2 |
| Cloud API WhatsApp como default | Só se `MESSAGING_PROVIDER=cloud` (ops) |
| Pagamento, comissão, relatórios CSV | S6 |
| Billing SaaS, `SUSPENDED` desliga página | S7 |
| Captcha Turnstile produção | S8 / ops |
| Métrica `first_public_booking` instrumentada | S5 opcional / S8 |

---

## Blocos de entrega

### Bloco 1 — Contratos + DDL + ports/adapters

- [ ] `contracts/`: `MessagingAccount`, status sessão, `Notification` log, queries QR, enums `NotificationStatus` / `MessagingChannel`
- [ ] Prisma: migrations `notification`, conta/sessão tenant (campos `risk_accepted_at`, `session_status`, `session_name`, …)
- [ ] Módulo `backend/src/modules/messaging/`: estrutura BC (types, enum, schema, repository, service, controller, routes, `messaging_public.ts` se necessário)
- [ ] Ports: `MessagingProvider`, `EmailProvider`
- [ ] Adapters: `fake`, `resend` (+ Mailpit dev), `waha` (client HTTP; `WAHA_API_KEY` só backend)
- [ ] Seed templates default pt-BR (cinco chaves)
- [ ] API: `POST /messaging/account`, `GET /messaging/account`, `GET /messaging/account/qr`, `DELETE /messaging/account` ([docs/08 §3.4](../../08-api-v1.md))
- [ ] Webhook: `POST /webhooks/waha` com HMAC + idempotência

### Bloco 2 — Worker BullMQ + dispatcher outbox

- [ ] Substituir stub `worker.ts` por processo BullMQ (Redis S0)
- [ ] Job: consumir `outbox_event` → `SendNotificationService` (confirmação imediata)
- [ ] Jobs atrasados: `reminder_24h`, `reminder_2h` (agendar/cancelar/reagendar em reschedule/cancel)
- [ ] Persistir cada tentativa em `notifications` (`provider`, `channel`, `status`, `provider_message_id`)
- [ ] Retry + `last_error` em outbox; dead-letter após N tentativas
- [ ] Respeitar `marketing_opt_in` / `consentWhatsappMarketing`; recusa explícita `BLOCKED_NO_CONSENT`
- [ ] Smoke `test:messaging`: book → notification `SENT` (fake); cancel → lembretes cancelados
- [ ] Integração: `test:scheduling` segue verde (outbox intacta)

### Bloco 3 — Frontend: conexão WAHA + banner

| RF | Checklist |
| --- | --- |
| RF-E6-10 | [ ] Checkbox ciência obrigatório antes do QR |
| RF-E6-14 | [ ] OWNER vê falhas de envio e sessão desconectada |
| RF-E6-15 | [ ] UI só chama API `/messaging/*` |

- [ ] Rota `/(app)/configuracoes/whatsapp` (ou subrota acordada) — OWNER only
- [ ] Fluxo: aceite → iniciar conexão → exibir QR/pairing → poll até `CONNECTED`
- [ ] Banner global no shell autenticado quando sessão ≠ `CONNECTED`
- [ ] Kill switch (desconectar) na mesma tela
- [ ] Package `messaging`: Data → Service → Hook → Component (sem import de `operacional`)

### Bloco 4 — Aceite: e2e, fallback, M4

- [ ] Playwright `frontend/e2e/s5-acceptance.spec.ts`:
  - Fluxo 10 ([docs/12 §2.9](../../12-qualidade-testes.md)): checkbox ciência **antes** do QR (mock/fake provider)
  - Fluxo 11: sessão desconectada → ainda agenda na pública/painel; banner visível; e-mail fallback registrado
  - Book público ou painel → registro `notification` confirmação (via API ou UI de status)
- [ ] Lembrete 24 h / 2 h: teste acelerado (clock fake ou `startsAt` curto + job delay override em test env)
- [ ] `pnpm test:messaging` + smokes S2/S4 verdes
- [ ] Job CI `e2e-s5` (API + worker + web + seed)
- [ ] Runbook [sessao-waha-caida.md](../runbooks/sessao-waha-caida.md) revisado pós-implementação

---

## Endpoints novos / alterados (docs/08)

```
POST   /api/v1/messaging/account          { "riskAccepted": true }
GET    /api/v1/messaging/account
GET    /api/v1/messaging/account/qr
DELETE /api/v1/messaging/account          # kill switch

POST   /api/v1/webhooks/waha              # HMAC; sem JWT tenant (resolve por session)

GET    /api/v1/notifications?appointmentId=   # opcional Bloco 3 — status envio (OWNER)
```

Agendamento (`POST /appointments`, `POST /public/.../appointments`) **inalterado** — side effect via outbox.

---

## Aceite da sprint (DoD S5 · Marco M4)

| # | Critério | Como provar |
| --- | --- | --- |
| 1 | Confirmação | Após book (painel ou público), `notification` confirmação `SENT` (fake ou WAHA teste) |
| 2 | Lembretes | Jobs 24 h e 2 h enfileirados; remarcar recalcula; cancelar remove pendentes |
| 3 | Fallback | WAHA off → e-mail enviado (Mailpit/Resend); agenda OK |
| 4 | Ciência | Sem checkbox → 422; QR não aparece |
| 5 | Kill switch | DELETE desconecta sessão; automações param |
| 6 | Marketing | Sem opt-in → não envia marketing; transacional OK |
| 7 | Webhook | Evento duplicado → um efeito (idempotência) |
| 8 | Isolamento | Tenant A não vê conta/notifications de B |
| 9 | e2e | `s5-acceptance.spec.ts` fluxos 10–11 verdes + CI |
| 10 | Sem regressão | `s4-acceptance`, `test:scheduling`, `test:public-booking` verdes |

**Fora do aceite S5:** inbox, SMS, Cloud API default, taxa entrega ≥ 95% em produção (meta pós-piloto).

---

## Qualidade / CI

- Manter smokes S2 + e2e S3 + e2e S4
- Acrescentar `test:messaging` (backend) e job `e2e-s5`
- Worker roda no CI do job e2e-s5 (mesmo Redis do Compose)
- `MESSAGING_PROVIDER=fake` no pipeline; WAHA real só staging/manual

---

## Paths (Orius)

```
contracts/src/
  messaging.ts                 # tipos + Zod

backend/prisma/migrations/
  …_messaging_core/            # notification + account

backend/src/modules/messaging/
  enum/ …
  types/ …
  schemas/ …
  repositories/ …
  services/account/ …
  services/notification/ …
  ports/messaging_provider.ts
  adapters/fake/ | resend/ | waha/
  controllers/messaging.controller.ts
  routes/v1/messaging.routes.ts
  messaging.module.ts

backend/src/worker/
  dispatcher/outbox_consumer.ts
  jobs/send_confirmation.ts
  jobs/send_reminder.ts
  jobs/cancel_reminders.ts

frontend/src/packages/messaging/
  components/MessagingAccountIndex.tsx
  components/MessagingConnectForm.tsx
  data/ … / services/ … / hooks/ …

frontend/e2e/s5-acceptance.spec.ts
```

Fluxo backend: `Routes → Controller → Service → [Action?] → Repository`. Worker: handler → Service → Port. Frontend: `Page → Component → Hook → Service → Data → API`.

---

## Bloqueios

_Nenhum no momento._

## Notas

- DPA / ciência jurídica WhatsApp: alinhar com [roadmap §5](../../13-roadmap-estimativas.md) — ideal contrato assinado **antes** do piloto com WAHA real.
- Número **dedicado** para testes — nunca WhatsApp comercial da barbearia piloto.
- Se prazo apertar ([docs/13 §9](../../13-roadmap-estimativas.md)): cortar WAHA e entregar **só e-mail** — ainda cumpre M4 com fallback; WAHA liga em hardening S8.
- Compose: serviço WAHA documentado em ops; S5 pode começar só com `fake` + Mailpit.
