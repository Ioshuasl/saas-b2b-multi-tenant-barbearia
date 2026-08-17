# 08 — API v1

## 1. Convenções

| Tema | Regra |
| --- | --- |
| Base | `https://api.{dominio}/api/v1` |
| Versionamento | Prefixo de URL — [ADR-0003](./adr/0003-versionamento-api.md) |
| Formato | JSON; payload **camelCase** (nunca snake_case na borda) |
| Datas | ISO 8601 com offset; servidor persiste UTC |
| Dinheiro | Inteiro em centavos, sufixo `Cents` |
| IDs | UUID v7 em string |
| Envelope | Sucesso `{ "data" }` (+ `"meta"` em listas). Erro `{ "error" }` |
| Paginação | Cursor `?limit=50&cursor=`; `limit` máx. 100; `meta.nextCursor` |
| Filtros | Query params tipados por Zod; sem `?where=` |
| Idempotência | `Idempotency-Key` obrigatório em POST de agendamento, pagamento e envio de mensagem |
| Auth | `Authorization: Bearer <accessToken>`; refresh em cookie httpOnly |
| Tenant | Só do JWT. **`X-Location-Id`** = unidade ativa, revalidada contra `user_locations` |
| Correlação | `X-Request-Id` aceito e devolvido |
| Rate limit | `RateLimit-Limit` / `Remaining` / `Reset` |
| Docs | OpenAPI 3.1 gerado dos Zod, em `/api/v1/docs` |

Três superfícies:

| Superfície | Prefixo | Auth | Tenant/unidade |
| --- | --- | --- | --- |
| Pública | `/api/v1/public/{tenantSlug}[/{locationSlug}]` | nenhuma (rate-limited) | slugs |
| Painel | `/api/v1/*` | Bearer JWT | tenant do token; `X-Location-Id` |
| Plataforma | `/api/v1/platform/*` | JWT `platform_admin` + MFA | explícito + auditado |

### Erro

```json
{
  "error": {
    "code": "SLOT_TAKEN",
    "message": "Este horário acabou de ser reservado.",
    "details": [{ "field": "startsAt", "issue": "conflict" }],
    "requestId": "req_01J..."
  }
}
```

`code` é contrato estável; `message` é pt-BR e pode mudar. Recurso de outro tenant **ou** de unidade fora do escopo → **404**, nunca 403 (não revela existência).

| HTTP | `code` | Quando |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Zod |
| 401 | `UNAUTHENTICATED` | Token ausente/expirado |
| 403 | `FORBIDDEN` | Papel sem permissão (mesmo tenant, recurso permitido de existir) |
| 404 | `NOT_FOUND` | Inexistente, outro tenant ou outra unidade |
| 409 | `SLOT_TAKEN` | Conflito de agenda |
| 409 | `DUPLICATE_RESOURCE` | Slug, telefone, e-mail |
| 409 | `INVALID_STATE_TRANSITION` | Máquina de estados |
| 409 | `IDEMPOTENCY_KEY_REUSED` | Mesma chave, corpo diferente |
| 422 | `BUSINESS_RULE_VIOLATION` | Lead time, horizonte, opt-in |
| 422 | `OUTSIDE_BUSINESS_HOURS` | Fora da jornada |
| 422 | `TOO_LATE_TO_CANCEL` | Após `cancel_deadline_hours` |
| 402 | `SUBSCRIPTION_REQUIRED` | `SUSPENDED` / escrita bloqueada |
| 402 | `PLAN_LIMIT_EXCEEDED` | Profissionais ou unidades |
| 429 | `RATE_LIMITED` | Auth e rotas públicas |
| 500 | `INTERNAL_ERROR` | Sem stack |
| 503 | `PROVIDER_UNAVAILABLE` | WAHA / Resend / S3 |

Não há `POST /billing/checkout-session` nem portal de cartão no OpenAPI do MVP ([ADR-0010](./adr/0010-billing-saas-manual-mvp.md)).

## 2. Mapa de endpoints do MVP

### 2.1 Autenticação e identidade (`identity`)

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
POST   /api/v1/users/invitations/accept     público (token)
PATCH  /api/v1/users/:id                    papel, unidades, ativo
```

Signup cria `tenant` + `location` padrão + `OWNER` + seeds em uma transação. Claims do access token (15 min): `sub`, `tenant_id`, `role`, `staff_id?`. **`location_id` não vai no token.** Refresh 30 dias, rotativo; reuso revoga a família.

### 2.2 Rede e cadastros (`locations`)

```
GET    /api/v1/tenant
PATCH  /api/v1/tenant
GET    /api/v1/tenant/slug-available?slug=

GET    /api/v1/locations
POST   /api/v1/locations
PATCH  /api/v1/locations/:id
GET    /api/v1/locations/:id/slug-available?slug=

GET    /api/v1/services
POST   /api/v1/services
PATCH  /api/v1/services/:id
PUT    /api/v1/locations/:id/services/:serviceId   { active, priceCentsOverride, durationMinutesOverride }

GET    /api/v1/staff
POST   /api/v1/staff
PATCH  /api/v1/staff/:id
PUT    /api/v1/staff/:id/locations                 { locationIds[] }
PUT    /api/v1/staff/:id/services                  { serviceIds[] }
POST   /api/v1/staff/:id/invite

GET    /api/v1/business-hours                      ?locationId=&staffId=
PUT    /api/v1/business-hours                      substitui a grade semanal (weekday ISO)

GET    /api/v1/time-blocks
POST   /api/v1/time-blocks                         body pode incluir conflicts[] (não cancela)
DELETE /api/v1/time-blocks/:id
```

Leitura de catálogo/staff/horários: `settings.read` **ou** `agenda.read`. Escrita: `settings.write`. Criar unidade acima do plano → `402 PLAN_LIMIT_EXCEEDED` com caminho (“fale com a operação”).

### 2.3 Clientes (`customers`)

```
GET    /api/v1/customers                    ?search=&cursor=&limit=&active=
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id                inativa / inicia LGPD
GET    /api/v1/customers/:id/appointments
GET    /api/v1/customers/check-duplicate    ?phone=
```

`search` = nome parcial (`pg_trgm`) ou telefone. Sem CPF. `notes` sai decifrado só para quem tem `customers.read`.

### 2.4 Agenda (`scheduling`)

```
GET    /api/v1/appointments                 ?from=&to=&staffId=&status=&locationId=
POST   /api/v1/appointments                 Idempotency-Key
GET    /api/v1/appointments/:id
PATCH  /api/v1/appointments/:id             remarcar / notas
POST   /api/v1/appointments/:id/status      { status, reason? }
DELETE /api/v1/appointments/:id             { reason }
GET    /api/v1/appointments/:id/history

GET    /api/v1/availability                 ?serviceIds=&staffId=&from=&to=&locationId=
```

`STAFF` só vê/altera `staff_id` próprio. `locationId=all` só com escopo total.

Rotas públicas (sem JWT; rate `public:booking:ip` e `public:booking:location`; honeypot + captcha após N; máx. 3 agendamentos futuros por telefone):

```
GET    /api/v1/public/{tenantSlug}
GET    /api/v1/public/{tenantSlug}/{locationSlug}
GET    /api/v1/public/{tenantSlug}/{locationSlug}/availability
POST   /api/v1/public/{tenantSlug}/{locationSlug}/appointments
GET    /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
PATCH  /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
DELETE /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token=
```

**Sem OTP** no MVP (RF-E4-26). Consentimento de tratamento de dados obrigatório no POST. Marketing opt-in separado.

`GET /public/{tenantSlug}`: lista unidades ativas com booking (nome, endereço, lat/lng). 1 unidade → o front redireciona. Slug inválido → 404. Sem serviço visível na unidade → 200 com `bookingAvailable: false` (não 500).

### 2.5 Financeiro da barbearia (`billing`)

```
POST   /api/v1/appointments/:id/payments    Idempotency-Key  { amountCents, method }
GET    /api/v1/appointments/:id/payments
POST   /api/v1/payments/:id/reverse         Idempotency-Key  { reason }
```

Pagamento típico no `COMPLETED`. Sem caixa, contas a pagar, NFS-e.

### 2.6 Mensageria (`messaging`)

```
GET    /api/v1/messaging/account
POST   /api/v1/messaging/account            { riskAccepted: true }  → QR / pairingCode
GET    /api/v1/messaging/account/qr
PATCH  /api/v1/messaging/account            { killSwitch }
POST   /api/v1/messaging/account/test       Idempotency-Key
DELETE /api/v1/messaging/account            logout WAHA

GET    /api/v1/messaging/templates
GET    /api/v1/messaging/automations
PATCH  /api/v1/messaging/automations/:key   { enabled?, config? }
GET    /api/v1/messaging/logs               ?from=&to=&result=&cursor=

POST   /api/v1/webhooks/whatsapp            HMAC WAHA, raw body, 2 MB
```

Frontend **nunca** chama o WAHA. Connect sem `riskAccepted` → 422. Inbox **não** entra. Sem webhook de gateway de cartão no MVP.

### 2.7 Relatórios (`reporting`)

```
GET    /api/v1/reports/summary              ?from=&to=&staffId=&locationId=
GET    /api/v1/reports/commissions          ?from=&to=&locationId=
GET    /api/v1/reports/by-location          ?from=&to=     só OWNER
POST   /api/v1/reports/:report/export       { format: CSV } → 202 { jobId }
GET    /api/v1/exports/:id
```

Somente leitura. Período máximo limitado. Exportação gera `REPORT_EXPORTED` no audit. CSV UTF-8, separador adequado a Excel pt-BR.

### 2.8 Assinatura SaaS (`subscription`) — MVP manual

```
GET    /api/v1/subscription
GET    /api/v1/subscription/plans
GET    /api/v1/subscription/usage
```

Sem `POST /subscription/checkout`. UI do OWNER: status, uso, dias de trial, CTA “Fale conosco para ativar”.

### 2.9 Plataforma e LGPD

```
GET    /api/v1/audit-logs                   ?actorId=&action=&from=&to=
POST   /api/v1/privacy/data-subject-requests
GET    /api/v1/privacy/data-subject-requests
POST   /api/v1/privacy/exports
GET    /api/v1/health
GET    /api/v1/ready

GET    /api/v1/platform/tenants
GET    /api/v1/platform/tenants/:id
PATCH  /api/v1/platform/tenants/:id/subscription   { status, graceUntil, reason }
POST   /api/v1/platform/tenants/:id/impersonate    { reason }  leitura, TTL curto
POST   /api/v1/platform/tenants/:id/invoices       registro manual
```

Impersonation: MFA já no login do admin; motivo obrigatório; banner; só GET no painel do tenant.

## 3. Contratos detalhados dos fluxos críticos

### 3.1 Booking público

```http
POST /api/v1/public/corte-fino/centro/appointments
Idempotency-Key: 018f5d4a-...

{
  "serviceIds": ["018f5c55-..."],
  "staffId": null,
  "startsAt": "2026-08-20T14:00:00-03:00",
  "customer": { "name": "João Silva", "phone": "62999990000", "email": "joao@example.com" },
  "consentDataProcessing": true,
  "consentWhatsappMarketing": false
}
```

`staffId` null = qualquer profissional da unidade que execute os serviços. `endsAt` **não** é aceito. Telefone normalizado E.164. Cliente criado se `(tenant, phone)` não existir.

```http
201 Created
{
  "data": {
    "id": "018f5d61-...",
    "status": "SCHEDULED",
    "startsAt": "2026-08-20T17:00:00Z",
    "endsAt": "2026-08-20T17:40:00Z",
    "staff": { "id": "…", "name": "Carlos" },
    "services": [{ "name": "Corte", "durationMinutes": 40, "priceCents": 4500 }],
    "totalPriceCents": 4500,
    "cancelToken": "…"
  }
}
```

`409 SLOT_TAKEN` com `suggestedSlots`. `422` se fora do horizonte/lead time ou sem consentimento. Cancelamento público após prazo → `422 TOO_LATE_TO_CANCEL`. GET por token devolve dados **mascarados** (sem e-mail de outros, sem notas).

### 3.2 Criar agendamento no painel

```http
POST /api/v1/appointments
Authorization: Bearer <token>
X-Location-Id: 018f5c10-...
Idempotency-Key: 018f5d4a-...

{
  "customerId": "018f5c2b-...",
  "staffId": "018f5c31-...",
  "serviceIds": ["018f5c55-..."],
  "startsAt": "2026-08-20T14:00:00-03:00",
  "source": "PHONE",
  "notifyCustomer": true
}
```

Outbox `scheduling.appointment_scheduled` → jobs de confirmação + lembretes 24 h / 2 h. Conflito:

```http
409 Conflict
{ "error": { "code": "SLOT_TAKEN", "message": "Este horário acabou de ser reservado.",
  "details": [{ "suggestedSlots": ["2026-08-20T14:45:00-03:00"] }] } }
```

### 3.3 Disponibilidade

Mesma engine na pública e no painel: janelas da unidade ∩ jornada do staff na unidade − `time_block` − appointments ativos do **staff em todas as unidades**. Granularidade = duração do serviço. Timezone da **unidade**.

### 3.4 Conexão WAHA

`POST /messaging/account` `{ "riskAccepted": true }` → `PENDING` + `qr` / `pairingCode`. Poll `GET .../qr` até `CONNECTED`. Sem aceite → 422. `DELETE` faz logout na sessão e liga kill switch. WhatsApp caído **não** impede `POST /appointments`.

### 3.5 Assinatura (OWNER)

`GET /subscription` devolve plano, status, `trialEndsAt`, `graceUntil`, `usage: { staff, locations }`, `limits`. Em `TRIALING` expirado o job passa a `PAST_DUE` **sem** gateway. Escrita operacional em `SUSPENDED` → `402 SUBSCRIPTION_REQUIRED` (exportação e leitura liberadas).

## 4. Segurança dos endpoints

| Middleware (ordem) | Função |
| --- | --- |
| `helmet` | Cabeçalhos |
| `cors` | Origens por ambiente |
| `requestId` | Correlação |
| `bodyLimit` | 1 MB (webhook 2 MB) |
| `rateLimit` | IP, tenant, rotas públicas/auth |
| `authenticate` | JWT → `req.auth` |
| `tenantContext` | `req.ctx`; valida `X-Location-Id` |
| `authorize(permission)` | Papel + unidade + `staff_id` |
| `subscriptionGuard` | Bloqueia escrita se `SUSPENDED` |
| `validate(schema)` | Zod |
| `errorHandler` | `DomainError → HTTP` |

### Matriz (extrato)

| Endpoint | OWNER | MANAGER | RECEPTIONIST | STAFF |
| --- | :-: | :-: | :-: | :-: |
| `POST /appointments` | ✔ | ✔ (suas unidades) | ✔ (suas unidades) | ✖ |
| `POST /appointments/:id/status` | ✔ | ✔ | ✔ | ✔ (próprios) |
| `POST /appointments/:id/payments` | ✔ | ✔ | ✔ | ✖ |
| `GET /reports/summary` | ✔ | ✔ (escopo) | ✔ (escopo) | ✖ |
| `GET /reports/commissions` | ✔ | ✔ | ✖ | ✔ (própria) |
| `GET /reports/by-location` | ✔ | ✖ | ✖ | ✖ |
| `PATCH /tenant` | ✔ | ✖ | ✖ | ✖ |
| `POST /locations` | ✔ | ✖ | ✖ | ✖ |
| `GET /subscription` | ✔ | ✖ | ✖ | ✖ |
| `POST /privacy/exports` | ✔ | ✖ | ✖ | ✖ |
| `POST /messaging/account` | ✔ | ✖ | ✖ | ✖ |

## 5. Política de versionamento

- `v1` estável: mudanças aditivas não geram nova versão.
- Quebra de contrato → `v2`; `v1` no mínimo 6 meses + `Deprecation`/`Sunset`.
- CI: diff do OpenAPI falha o build se houver breaking change sem bump.
- `/api/v1/internal/*` sem garantia.

## 6. Padrões operacionais

**Idempotência:** chave 24 h; mesmo corpo → resposta original; corpo diferente → `409 IDEMPOTENCY_KEY_REUSED`.

**Concorrência:** `version` + `If-Match` na agenda; `412` em conflito.

**Long-running:** exportações `202` + `GET /exports/:id`.

**Webhooks de saída:** fase 3.

## Referências

- [ADR-0003](./adr/0003-versionamento-api.md) · [ADR-0010](./adr/0010-billing-saas-manual-mvp.md) · [ADR-0016](./adr/0016-waha-default-messaging.md)
- [07 — Modelo de dados](./07-modelo-de-dados.md)
- [09 — Frontend](./09-frontend.md)
- [modulos/](./modulos/)
