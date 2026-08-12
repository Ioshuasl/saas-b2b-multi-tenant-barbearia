# 13 — Provedores de Pagamento (pesquisa para decisão)

> Pesquisa de mercado para você decidir depois. Nenhuma escolha foi feita — o código deve isolar isso atrás de uma interface `PaymentProvider` (ver "Como não travar a decisão" no fim).
> Taxas coletadas em agosto/2026 nas páginas oficiais e em comparativos públicos. **Confirme na página do provedor antes de fechar**, pois mudam com frequência e há negociação por volume.

## O que a nossa operação exige

1. **Recorrência mensal** com retentativa automática (dunning) — a barbearia não pode cair só porque o cartão venceu.
2. **Pix e/ou boleto**, não só cartão de crédito. Boa parte de dono de barbearia PJ pequeno não coloca assinatura em cartão de crédito.
3. **Webhooks confiáveis** — o estado da assinatura no nosso banco depende deles.
4. **Portal do cliente** (atualizar cartão, ver faturas) pronto, para não gastarmos semanas construindo.
5. **Custo por transação baixo** — no ticket de R$ 49–179/mês, cada 1% importa.
6. **Nota fiscal** — vamos precisar emitir NFS-e para as barbearias; provedor que já faz isso economiza integração.

## Comparativo

| Provedor | Mensalidade | Cartão recorrente | Pix | Boleto | Recorrência nativa | Portal do cliente | NF | Observação |
|---|---|---|---|---|---|---|---|---|
| **Asaas** | Grátis (pay-per-use) | ~2,99% + R$ 0,49 (tabela padrão; ~1,99% + R$ 0,49 na condição promocional/assinaturas) | 0,5% (mín. ~R$ 0,99; R$ 1,99 fixo em algumas faixas) | ~R$ 1,99 | Sim | Básico | **Sim, nativa** | Melhor entrada: sem mensalidade, Pix/boleto nativos, NF integrada. DX inferior à Stripe |
| **Iugu** | a partir de ~R$ 99/mês | 2,5%–3,4% | ~0,5% | R$ 1,50–2,00 | Sim | Sim | Via integração | API limpa, feita para dev; mensalidade fixa pesa no começo |
| **Pagar.me** | Sob consulta | ~2,99%–3,5% | ~0,99%–1,5% | ~R$ 2–3 | Sim | Sim | Não | Robusto, do grupo Stone; bom se houver volume |
| **Vindi** (TOTVS) | a partir de ~R$ 259/mês | ~2,5% | a partir de 0,5% | Incluso | Sim, é o foco | Sim | Não | Régua de cobrança e recuperação de receita muito boas — mas mensalidade alta para o estágio atual |
| **Stripe** | Grátis | 3,99% + R$ 0,39/0,50 | 1,19% | Sim | Sim (Billing +0,7% do volume) | **Excelente** (Customer Portal pronto) | Não | Melhor DX e melhor portal/dunning do mercado; **mais cara** e Pix **recorrente** não é nativo |
| **Mercado Pago** | Grátis | ~3,79%–4,98% | ~0,49%–0,99% | Sim | Sim (preapproval) | Fraco | Não | Marca conhecida pelo público-alvo; taxas de cartão altas |
| **Superlógica** | a partir de ~R$ 499/mês | ~2,5% | Incluso | Incluso | Sim | Sim | Módulo pago | Voltado a condomínio/escola; caro demais aqui |

## Simulação de custo (100 tenants × R$ 99/mês = R$ 9.900 de MRR)

| Cenário | Custo mensal do provedor | % do MRR |
|---|---|---|
| Asaas, 70% cartão / 30% Pix | ~R$ 240 (cartão) + ~R$ 15 (Pix) ≈ **R$ 255** | ~2,6% |
| Stripe Billing, 100% cartão | ~R$ 395 + 0,7% (R$ 69) ≈ **R$ 464** | ~4,7% |
| Iugu, 70/30 | ~R$ 99 fixo + ~R$ 250 ≈ **R$ 349** | ~3,5% |
| Vindi | ~R$ 259 fixo + ~R$ 245 ≈ **R$ 504** | ~5,1% |

Em volume baixo, **quem não cobra mensalidade fixa ganha**. Acima de ~R$ 50k de MRR a diferença de mensalidade some e o que pesa é a taxa por transação e a qualidade do dunning.

## Pix Automático (relevante para 2026)

O Banco Central lançou o **Pix Automático**: recorrência autorizada uma única vez pelo app do banco do pagador, sem cartão e sem convênio banco a banco. Para o nosso público (PJ pequeno que evita cartão de crédito) é potencialmente o melhor meio de cobrança: custo de Pix (~0,5%–1%) com previsibilidade de débito automático.

Requisitos: CNPJ ativo há mais de 6 meses, conta em instituição que ofereça o serviço, e **planos com valor fixo** (mudança de valor exige nova autorização — atenção ao nosso modelo de upgrade/downgrade).

Disponibilidade varia por provedor (Mercado Pago, Asaas e outros já anunciaram suporte). **Isso deve ser um critério de desempate na escolha.**

## Recomendação (não vinculante)

1. **Asaas** para começar: zero mensalidade, Pix/boleto nativos, NFS-e integrada, taxa competitiva. Aceitar a DX inferior.
2. **Stripe** se o critério for velocidade de implementação e você tolerar ~2 pontos percentuais a mais — o Customer Portal e o Smart Retries economizam semanas de trabalho.
3. **Vindi/Superlógica** só quando o MRR justificar a mensalidade.

## Como não travar a decisão

Codar contra uma interface, com adapters por provedor. Assim a escolha vira configuração:

```ts
interface PaymentProvider {
  createCustomer(tenant: Tenant): Promise<ProviderCustomerId>;
  createSubscription(input: { customerId; planCode; trialEndsAt }): Promise<ProviderSubscription>;
  updateSubscription(id: ProviderSubscriptionId, input: { planCode }): Promise<void>;
  cancelSubscription(id: ProviderSubscriptionId): Promise<void>;
  createCheckoutSession(input): Promise<{ url: string }>;
  createPortalSession(input): Promise<{ url: string }>;
  parseWebhook(rawBody: Buffer, signature: string): Promise<ProviderEvent>; // normaliza para nosso domínio
}
```

Regras que valem para **qualquer** provedor:
- Webhook é a fonte da verdade; retorno do browser nunca ativa assinatura.
- `webhook_events.provider_event_id UNIQUE` para idempotência.
- Job diário de reconciliação comparando estado local × provedor.
- Nenhum dado de cartão passa pelo nosso servidor (checkout hospedado/tokenização).

## Fontes
- https://www.asaas.com/precos-e-taxas
- https://stripe.com/br/pricing e https://stripe.com/br/billing/pricing
- https://www.bcb.gov.br — Pix Automático (guia de implementação)
- Comparativos públicos de cobrança recorrente PME (Asaas × Iugu × Vindi × Superlógica), 2026
