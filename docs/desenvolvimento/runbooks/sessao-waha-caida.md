# Runbook — sessão WAHA caída

A agenda **não** depende do WhatsApp. Se a sessão cair, o cliente continua marcando; confirmações e lembretes saem por e-mail (Mailpit local / Resend em produção).

## Sintoma

- Banner no painel: “Canal de mensagens desconectado”
- Status em Configurações → Mensagens diferente de **Conectado**
- `notification` com `FAILED` e fallback para canal `EMAIL`
- Dashboard WAHA: sessão `STOPPED` / `FAILED` / QR expirado

## Ação

1. **Não desligar a agenda.** `/appointments` e a página pública seguem no ar.
2. OWNER reconecta em `/configuracoes/whatsapp` (checkbox de ciência → QR / pairing) com **chip dedicado** — nunca o número comercial da barbearia.
3. Se o número foi banido: trocar chip; não reutilizar o comercial.
4. Kill switch: `DELETE /api/v1/messaging/account` faz logout da sessão WAHA e desliga envios automáticos daquele tenant, sem afetar agendamentos.
5. Registrar no audit; avisar o OWNER que lembretes saíram por e-mail até reconectar.

## Webhook local (dev)

A API escuta `POST /api/v1/webhooks/whatsapp` (HMAC SHA-512, header `X-Webhook-Hmac`). Em máquina local, exponha a porta **3333** (ngrok) e grave a URL em `WAHA_WEBHOOK_URL` + config da sessão no WAHA. `APP_PUBLIC_URL` é o frontend (`:3000`) e **não** serve como callback.
