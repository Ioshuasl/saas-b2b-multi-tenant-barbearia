# 06 — API e Contratos

REST/JSON, versionada em `/api/v1`. Três superfícies com regras de acesso distintas.

Implementada em **Express + TypeScript**, com validação de payload por `zod` e OpenAPI gerado a partir dos schemas.

| Superfície | Prefixo | Auth | Tenant/unidade vem de |
|---|---|---|---|
| Pública (cliente final) | `/api/v1/public/{tenantSlug}[/{locationSlug}]` | nenhuma (rate-limited) | slugs do path |
| Painel | `/api/v1/*` | Bearer JWT | tenant do token; unidade via `X-Location-Id`, validada contra `user_locations` |
| Plataforma | `/api/v1/platform/*` | JWT com `platform_admin` | explícito + auditado |

## Autenticação

- Access token JWT curto (15 min) + refresh token httpOnly rotativo (30 dias).
- Claims: `sub`, `tenant_id`, `role`, `staff_id?`, `exp`. **`location_id` não vai no token** — o usuário troca de unidade sem reemitir token; o escopo é checado em `user_locations` a cada request.
- Senhas com argon2id. Rate limit de login: 5 tentativas/min por IP+e-mail.
- Convite de profissional: token de uso único, expira em 7 dias.

## Formato de erro (padrão em toda a API)

```json
{
  "error": {
    "code": "SLOT_TAKEN",
    "message": "Este horário acabou de ser reservado.",
    "details": { "starts_at": "2026-03-04T13:00:00Z" },
    "request_id": "01HX..."
  }
}
```

Códigos previstos: `VALIDATION_ERROR` (422), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `SLOT_TAKEN` (409), `OUTSIDE_BUSINESS_HOURS` (422), `TOO_LATE_TO_CANCEL` (422), `RATE_LIMITED` (429), `SUBSCRIPTION_INACTIVE` (402), `INTERNAL` (500).

Regra: recurso de outro tenant retorna **404**, nunca 403 (não revela existência).

## Endpoints públicos

```
GET  /api/v1/public/{tenantSlug}
     → { tenant: {...}, locations: [ { slug, name, address, lat, lng } ] }
       (com 1 unidade ativa, o front redireciona direto para ela)

GET  /api/v1/public/{tenantSlug}/{locationSlug}
     → dados da unidade, endereço, serviços visíveis (com preço da unidade),
       profissionais que aceitam agendamento online ali

GET  /api/v1/public/{tenantSlug}/{locationSlug}/availability
     ?service_ids=uuid,uuid&staff_id=uuid|any&from=2026-03-01&to=2026-03-31
     → { "days": [ { "date": "2026-03-01",
                     "slots": [ { "starts_at": "...", "staff_id": "..." } ] } ] }

POST /api/v1/public/{tenantSlug}/{locationSlug}/appointments
     { service_ids[], staff_id|null, starts_at, customer: { name, phone, email? } }
     → 201 { id, starts_at, ends_at, cancel_token, staff, services, total_price_cents }
     → 409 SLOT_TAKEN

GET    /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token={cancel_token}
DELETE /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token={cancel_token}
PATCH  /api/v1/public/{tenantSlug}/{locationSlug}/appointments/{id}?token={cancel_token}
```

Proteções da rota pública: rate limit por IP e por unidade, honeypot + captcha após N tentativas, validação de telefone, e limite de agendamentos futuros por telefone (default 3).

## Endpoints do painel

```
POST   /api/v1/auth/signup            (cria tenant + OWNER)
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/me

GET    /api/v1/tenant                 PATCH /api/v1/tenant
GET    /api/v1/tenant/slug-available?slug=

CRUD   /api/v1/locations                        (unidades da rede)
GET    /api/v1/locations/{id}/slug-available?slug=

CRUD   /api/v1/services                         (catálogo da rede)
PUT    /api/v1/locations/{id}/services/{serviceId}   { active, price_cents_override }

CRUD   /api/v1/staff
PUT    /api/v1/staff/{id}/locations             { location_ids[] }
POST   /api/v1/staff/{id}/invite
CRUD   /api/v1/business-hours                   (escopo por unidade)
CRUD   /api/v1/time-blocks

GET    /api/v1/appointments?from=&to=&staff_id=&status=&location_id=all
POST   /api/v1/appointments
PATCH  /api/v1/appointments/{id}                (remarcar/editar)
POST   /api/v1/appointments/{id}/status         { status }
POST   /api/v1/appointments/{id}/payments       { amount_cents, method }
GET    /api/v1/availability                     (mesma engine da pública)

CRUD   /api/v1/customers
GET    /api/v1/customers/{id}/appointments

GET    /api/v1/reports/summary?from=&to=&staff_id=&location_id=all
GET    /api/v1/reports/commissions?from=&to=&location_id=
GET    /api/v1/reports/by-location?from=&to=      (consolidado da rede, só OWNER)
GET    /api/v1/reports/export.csv?...

GET    /api/v1/billing/subscription
POST   /api/v1/billing/checkout-session
POST   /api/v1/billing/portal-session
```

## Webhooks (entrada)

```
POST /api/v1/webhooks/payments      (assinatura verificada, idempotente via webhook_events)
POST /api/v1/webhooks/whatsapp      (status de entrega / respostas — Evolution API ou BSP oficial,
                                     normalizados pelo mesmo adapter)
```

Regra: webhook é a fonte da verdade do estado da assinatura. Retorno do browser após checkout nunca ativa nada sozinho.

## Convenções

- Paginação por cursor: `?limit=50&cursor=...` → `{ data: [], next_cursor }`.
- Datas sempre ISO-8601 com offset. A API nunca aceita data "naive".
- Valores monetários em centavos (inteiro), nunca float.
- Idempotência em POSTs críticos via header `Idempotency-Key`.
- `request_id` em toda resposta e em todo log (com `tenant_id` e `location_id`).
- Endpoints do painel aceitam `location_id=all` apenas para quem tem escopo em todas as unidades; caso contrário o filtro é restringido silenciosamente ao escopo do usuário.
- OpenAPI gerado a partir do código e publicado em `/docs`.
