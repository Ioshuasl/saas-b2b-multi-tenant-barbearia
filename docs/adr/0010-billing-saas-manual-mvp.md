# ADR-0010 — Cobrança da assinatura SaaS: manual no MVP; gateways candidatos depois

- **Status:** Aceito
- **Data:** 2026-08-17
- **Contexto:** Módulo `subscription` — cobrança **plataforma → barbearia** (não confundir com financeiro do atendimento, módulo `billing`)

## Contexto

O produto precisa de trial, planos, limites e estados (`TRIALING` → `ACTIVE` → `PAST_DUE` → `NEGOTIATING` → `SUSPENDED` → `CANCELED`). Automatizar cartão/Pix via gateway exige CNPJ, compliance e operação financeira da plataforma prontos. O time optou por **não automatizar a cobrança no momento**, sem descartar integração futura — alinhado ao prontuário odontológico de referência.

## Decisão

1. **MVP / agora:** cobrança da assinatura é **manual** (fora do app ou com registro administrativo simples). O sistema continua a gerenciar:
   - trial de 14 dias sem cartão;
   - planos e limites (`usage_counter`, profissionais ativos **e** unidades);
   - status da assinatura alterável por `platform_admin` / operação (ativar, marcar `PAST_DUE`, negociar `grace_until`, suspender, cancelar);
   - em `SUSPENDED`: página pública desativada; painel só pagamento + exportação.
2. **Não** integrar checkout de cartão/Pix no app nesta fase. Nenhum endpoint de checkout ativo até novo ADR escolher o gateway.
3. **Candidatos futuros** (escolher um quando for automatizar), todos via port `PaymentProvider` / `SubscriptionBillingPort`:
   - **Stripe** (Checkout/Billing)
   - **Mercado Pago** (Assinaturas / Pix)
   - **Asaas** (assinaturas, boleto, Pix, ecossistema BR)
4. Modelo de dados já prevê `provider_customer_id` / `provider_subscription_id` em `subscriptions` para encaixar o gateway sem migração dolorosa.
5. **Inadimplência negociada permanece política de produto:** nada é desativado automaticamente antes de contato humano e `grace_until` (ver [pesquisa/billing-planos.md](../pesquisa/billing-planos.md)). A operação registra o prazo no back-office com motivo e auditoria.
6. Comparativo de taxas dos candidatos: [pesquisa/provedores-pagamento.md](../pesquisa/provedores-pagamento.md).

## Consequências

**Positivas:** desbloqueia Sprint 0 e piloto sem depender de conta de adquirente; reduz escopo do E8; evita PCI e complexidade de webhook cedo demais.

**Negativas:** ativação de plano pagante exige processo humano; risco de atraso na conversão trial→pago — mitigar com checklist operacional, banner no app e fila “tenants a cobrar”.

## Alternativas rejeitadas (por ora)

**Stripe/MP/Asaas já no MVP:** rejeitado temporariamente por decisão de produto/ops; permanece no radar.

**Omitir por completo o módulo subscription:** rejeitado — trial, limites, `grace_until` e suspensão são necessários mesmo sem cobrança automática.

## Verificação

- Trial expira após 14 dias e passa a `PAST_DUE` sem gateway; página pública permanece ativa até negociação/suspensão.
- Operação consegue marcar tenant como `ACTIVE` / `NEGOTIATING` / `SUSPENDED` de forma auditada (`grace_until` com motivo).
- Nenhum endpoint de checkout ativo até novo ADR escolher o gateway.
- Port de billing documentada; implementação = adapter manual / no-op.

## Referências

- [docs/requisitos/funcionais/08-billing-saas.md](../requisitos/funcionais/08-billing-saas.md)
- [docs/08-api-v1.md](../08-api-v1.md)
- [docs/13-roadmap-estimativas.md](../13-roadmap-estimativas.md)
- [pesquisa/provedores-pagamento.md](../pesquisa/provedores-pagamento.md)
