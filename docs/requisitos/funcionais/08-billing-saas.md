# RF — Billing SaaS / Assinatura (E8)

**Módulo:** `subscription` · **Detalhe:** [modulos/08-billing-saas.md](../../modulos/08-billing-saas.md) · Pesquisa: [pesquisa/billing-planos.md](../../pesquisa/billing-planos.md), [pesquisa/provedores-pagamento.md](../../pesquisa/provedores-pagamento.md)

> Cobrança **plataforma → barbearia**. Não confundir com E5 (financeiro do atendimento).

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E8-01 | Trial de 14 dias sem cartão, plano completo para testar; contador/banner com dias restantes | Must | J5, pesquisa billing |
| RF-E8-02 | Avisos de fim de trial (ex.: D-2 e-mail + banner) | Must | J5 |
| RF-E8-03 | Planos com limites por profissionais ativos **e** número de unidades; adicional por unidade extra | Must | pesquisa billing |
| RF-E8-04 | Limites aplicados no servidor; estouro acionável (upgrade / desativar recursos) | Must | doc 08 |
| RF-E8-05 | Integração atrás de interface `PaymentProvider` (adapters Stripe / Asaas / Mercado Pago) | Must | Decisão E |
| RF-E8-06 | Primeiros tenants: billing pode ser **configurado manualmente** pela operação da plataforma (sem bloquear o desenvolvimento) | Must | Decisão E |
| RF-E8-07 | Quando houver checkout: webhook é a fonte da verdade; retorno do browser nunca ativa assinatura sozinho | Must | US-06, doc 08 |
| RF-E8-08 | Idempotência de webhooks via `webhook_events.provider_event_id UNIQUE` | Must | doc 07/08 |
| RF-E8-09 | Estados: `TRIALING` → `ACTIVE` → `PAST_DUE` → `NEGOTIATING` → `SUSPENDED` → `CANCELED` | Must | pesquisa billing, doc 06 |
| RF-E8-10 | **Nada é desativado automaticamente por inadimplência** antes de contato humano e prazo acordado (`grace_until`) | Must | ADR negócio, J5 |
| RF-E8-11 | Em `PAST_DUE` / `NEGOTIATING` (enquanto `now < grace_until`): página pública e painel permanecem ativos | Must | pesquisa billing |
| RF-E8-12 | Em `SUSPENDED`: página pública desativada; painel só pagamento + exportação; notificações desligadas | Must | pesquisa billing |
| RF-E8-13 | Dados nunca apagados por inadimplência antes de 90 dias em `SUSPENDED` | Must | doc 10 |
| RF-E8-14 | Back-office: fila “tenants a cobrar” com dias em atraso, histórico e botão de estender `grace_until` (motivo + auditoria) | Must | E9, pesquisa billing |
| RF-E8-15 | `OWNER` visualiza assinatura, plano, uso (profissionais/unidades) e status | Must | J5 |
| RF-E8-16 | Downgrade bloqueado se profissionais ou unidades ativas excederem o novo plano | Must | pesquisa billing |
| RF-E8-17 | Criar unidade acima do incluído exige confirmação explícita do novo valor | Must | pesquisa billing |
| RF-E8-18 | Feature flags por plano via configuração (`plan_features`), não `if plan ==` espalhado | Must | pesquisa billing |
| RF-E8-19 | Job diário de reconciliação local × provedor (quando gateway ativo) | Should | doc 08 |
| RF-E8-20 | Nenhum dado de cartão trafega/armazenado por nós (checkout hospedado / tokenização) | Must | RNF-SEC |

## Critérios de aceite transversais (E8)

- Trial expira após 14 dias.
- `platform_admin` define `grace_until` com motivo obrigatório em `audit_logs`.
- Ciclo de vida de inadimplência negociada é testável (estados + gates de página pública).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E8-21 | Cupons, indicação com bônus, NFS da assinatura | Could (fase 2) |
| RF-E8-22 | Pix Automático como meio preferencial (quando CNPJ/elegibilidade ok) | Could (critério de desempate do provedor) |
