# Runbook — sessão WAHA caída

A Sprint 0 ainda **não** envia WhatsApp. O procedimento vale quando a S5 ligar o canal.

## Sintoma

QR desconectado, mensagens na fila, alerta de sessão.

## Ação

1. **Não desligar a agenda.** Cliente continua marcando; e-mail (Resend/Mailpit) é o fallback.
2. Reconectar a sessão no painel (QR) com chip dedicado.
3. Se o número foi banido: trocar chip; não usar o número comercial da barbearia.
4. Registrar no audit; avisar o OWNER que lembretes saíram por e-mail.

Kill switch: desligar envio WhatsApp por tenant sem afetar `/appointments`.
