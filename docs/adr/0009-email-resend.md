# ADR-0009 — E-mail transacional com Resend

- **Status:** Aceito
- **Data:** 2026-08-17
- **Contexto:** MVP — convites, reset de senha, ciclo de trial, **fallback obrigatório** quando WhatsApp indisponível

## Contexto

O produto precisa de e-mail transacional confiável. Alternativas: Resend, Amazon SES (conta AWS já usada para S3), ou outro ESP. SMTP genérico da VPS/Hostinger foi descartado para produção por reputação/entregabilidade.

## Decisão

1. **Provedor:** [Resend](https://resend.com) para e-mail transacional no MVP.
2. Integração atrás de port `EmailProvider` / `shared/integrations/email` — troca de provedor não vaza para o domínio.
3. Domínio de envio (ex.: `noreply@…`) com SPF/DKIM/DMARC configurados no DNS do produto (quando o domínio estiver fechado).
4. Local: **Mailpit** (já previsto no Docker Compose) captura e-mails; não chama Resend em `development` salvo flag explícita.
5. Segredo: `RESEND_API_KEY` (ou `MAIL_DSN` apontando para Resend) só no secret manager / env da VPS — nunca no repositório.

## Consequências

**Positivas:** setup rápido; API simples; alinhada ao stack TypeScript; boa DX.

**Negativas:** mais um provedor além de Hostinger + AWS; custo por mensagem (irrelevante no volume do MVP). SES permanece alternativa futura se quiser consolidar na AWS.

## Verificação

- Convite e reset de senha entregues em staging com domínio verificado.
- Falha do Resend não derruba a API (fila + retry); UI/log registram falha.
- WhatsApp indisponível: confirmação/lembrete sai por e-mail.
- Nenhum e-mail de produção sai sem DKIM no domínio.

## Referências

- [docs/11-infra-devops.md](../11-infra-devops.md)
- [docs/requisitos/funcionais/01-identidade-acesso.md](../requisitos/funcionais/01-identidade-acesso.md)
- [ADR-0008 — VPS + S3](./0008-hospedagem-vps-hostinger-s3.md)
