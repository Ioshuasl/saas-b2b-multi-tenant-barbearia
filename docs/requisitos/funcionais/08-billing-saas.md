# RF — Billing SaaS / Assinatura (E8)

**Módulo:** `subscription` · **Detalhe:** [modulos/08-billing-saas.md](../../modulos/08-billing-saas.md) · [ADR-0010](../../adr/0010-billing-saas-manual-mvp.md) · Pesquisa de planos: [pesquisa/billing-planos.md](../../pesquisa/billing-planos.md)

> Cobrança **plataforma → barbearia**. Não confundir com E5 (financeiro do atendimento).

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E8-01 | Trial de 14 dias sem cartão, plano completo para testar; contador/banner com dias restantes | Must | J5, ADR-0010 |
| RF-E8-02 | Avisos de fim de trial (ex.: D-2 e-mail + banner) | Must | J5 |
| RF-E8-03 | Planos com limites por profissionais ativos **e** número de unidades; adicional por unidade extra | Must | pesquisa billing |
| RF-E8-04 | Limites aplicados no servidor; estouro acionável (mensagem para falar com a operação / desativar recursos) | Must | ADR-0010 |
| RF-E8-05 | Port `PaymentProvider` / `SubscriptionBillingPort` existe; **adapter do MVP = manual** (operação altera status). Adapters Stripe / Mercado Pago / Asaas **não** entram no MVP | Must | ADR-0010 |
| RF-E8-06 | Cobrança da assinatura é **manual** no MVP: `platform_admin` ativa, marca `PAST_DUE`, estende `grace_until`, suspende ou cancela — com motivo e auditoria | Must | ADR-0010 |
| RF-E8-07 | Nenhum endpoint de checkout/portal de cartão ativo no MVP | Must | ADR-0010 |
| RF-E8-08 | Modelo de dados já prevê `provider_customer_id` / `provider_subscription_id` para encaixar gateway depois | Must | ADR-0010 |
| RF-E8-09 | Estados: `TRIALING` → `ACTIVE` → `PAST_DUE` → `NEGOTIATING` → `SUSPENDED` → `CANCELED` | Must | pesquisa billing, doc 06 |
| RF-E8-10 | **Nada é desativado automaticamente por inadimplência** antes de contato humano e prazo acordado (`grace_until`) | Must | ADR-0010, J5 |
| RF-E8-11 | Em `PAST_DUE` / `NEGOTIATING` (enquanto `now < grace_until`): página pública e painel permanecem ativos | Must | pesquisa billing |
| RF-E8-12 | Em `SUSPENDED`: página pública desativada; painel só pagamento (instruções manuais) + exportação; notificações desligadas | Must | pesquisa billing |
| RF-E8-13 | Dados nunca apagados por inadimplência antes de 90 dias em `SUSPENDED` | Must | doc 10 |
| RF-E8-14 | Back-office: fila “tenants a cobrar” com dias em atraso, histórico e botão de estender `grace_until` (motivo + auditoria) | Must | E9, ADR-0010 |
| RF-E8-15 | `OWNER` visualiza assinatura, plano, uso (profissionais/unidades) e status; banner “fale conosco para ativar” após o trial | Must | J5, ADR-0010 |
| RF-E8-16 | Downgrade bloqueado se profissionais ou unidades ativas excederem o novo plano | Must | pesquisa billing |
| RF-E8-17 | Criar unidade acima do incluído exige confirmação explícita (valor informado pela operação no MVP) | Must | pesquisa billing |
| RF-E8-18 | Feature flags por plano via configuração (`plan_features`), não `if plan ==` espalhado | Must | pesquisa billing |
| RF-E8-19 | Job diário de reconciliação local × provedor | Could (quando gateway ativo — fase 2) | ADR-0010 |
| RF-E8-20 | Nenhum dado de cartão trafega/armazenado por nós | Must | RNF-SEC, ADR-0010 |
| RF-E8-23 | Quando um ADR futuro escolher gateway: webhook é a fonte da verdade; retorno do browser nunca ativa assinatura sozinho; idempotência via `webhook_events.provider_event_id UNIQUE` | Could (fase 2) | ADR-0010 |

## Critérios de aceite transversais (E8)

- Trial expira após 14 dias e passa a `PAST_DUE` **sem** gateway.
- `platform_admin` define `grace_until` com motivo obrigatório em `audit_logs`.
- Ciclo de vida de inadimplência negociada é testável (estados + gates de página pública).
- Não há rota `/billing/checkout-session` no OpenAPI do MVP.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E8-21 | Cupons, indicação com bônus, NFS da assinatura | Could (fase 2) |
| RF-E8-22 | Pix Automático como meio preferencial (quando CNPJ/elegibilidade ok) | Could (desempate do provedor na fase 2) |
