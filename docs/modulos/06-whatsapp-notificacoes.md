# Módulo — WhatsApp e Notificações (`messaging`)

## 1. Responsabilidade

Confirmação e lembretes (24 h e 2 h), cancelamento/remarcação, log de envio, conexão da sessão e kill switch. Canais: **WhatsApp (WAHA GOWS)** + **e-mail Resend** (fallback obrigatório).

Inbox bidirecional **fora do MVP**. Frontend nunca chama o WAHA.

## 2. Decisão: WAHA no servidor

[ADR-0016](../adr/0016-waha-default-messaging.md). QR no **nosso** app; número **dedicado**; checkbox `risk_accepted_at` antes do QR. Cloud API só se `MESSAGING_PROVIDER=cloud`. Evolution não é default.

Consequência: viola ToS da Meta; risco de ban; copy de produto **não** diz “WhatsApp oficial”.

## 3. Conceitos

| Conceito | Consequência |
| --- | --- |
| Sessão WAHA | 1 por tenant (`session_name`); webhook resolve pelo `session` |
| Ciência de risco | Sem aceite, sem QR |
| Texto de automação | `message_template.body` + variáveis; adapter renderiza — não é template Meta no caminho WAHA |
| `provider_message_id` | Idempotência de webhook |
| Janela 21h–8h | Silêncio no fuso da **unidade** |
| Kill switch | Logout da sessão + automations off |

## 4. Textos do MVP

| Chave | Uso |
| --- | --- |
| `appointment_confirmation` | Ao criar |
| `reminder_24h` | 24 h antes |
| `reminder_2h` | 2 h antes |
| `appointment_cancelled` | Cancelamento |
| `appointment_rescheduled` | Remarcação |

Nunca diagnóstico (não há clínico). Variáveis mínimas: nome, barbearia/unidade, data/hora local, link de cancelamento. pt-BR.

Marketing exige `marketing_opt_in`; recusa explícita `BLOCKED_NO_CONSENT`.

## 5. Automações

1. Transparência: OWNER vê falhas e sessão caída (banner).
2. Cancelamento em cascata ao mover/cancelar o appointment.
3. Unique `(tenant, automation, target_type, target_id)`.
4. WhatsApp down **não** impede agendar; e-mail cobre; UI avisa.
5. Rate limit de envio; E.164 obrigatório.

## 6. Webhook

HMAC do **WAHA** (não `X-Hub-Signature-256` da Meta). Sem `hub.challenge`. Idempotência via `webhook_event` + `notification.provider_message_id`.

## 7. Casos de uso

`ConnectAccountService` (exige `riskAccepted`), `PollQrService`, `DisconnectService`, `SendNotificationService` (port `MessagingProvider` + `EmailProvider`), `HandleWahaWebhookService`.
