# Pesquisa — Provedores de Pagamento (fase 2)

> **MVP:** cobrança **manual** — sem gateway, sem checkout ([ADR-0010](../adr/0010-billing-saas-manual-mvp.md)). Este documento serve para escolher o provedor quando a fase 2 automatizar assinatura.
>
> Taxas coletadas em agosto/2026 nas páginas oficiais. **Confirme no provedor antes de fechar.**

## O que a operação exige (fase 2)

1. **Recorrência mensal** com retentativa (dunning).
2. **Pix e/ou boleto**, não só cartão — PJ pequeno evita cartão recorrente.
3. **Webhooks confiáveis** — estado da assinatura no banco depende deles.
4. **Portal do cliente** (atualizar cartão, ver faturas) pronto.
5. **Custo baixo** no ticket R$ 49–179/mês.
6. **NFS-e** — emitir para barbearias; provedor com NF nativa economiza integração.

## Comparativo

| Provedor | Mensalidade | Cartão recorrente | Pix | Boleto | Recorrência | Portal | NF | Observação |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Asaas** | Grátis | ~2,99% + R$ 0,49 | 0,5% (mín. ~R$ 0,99) | ~R$ 1,99 | Sim | Básico | **Sim** | Melhor entrada BR; DX inferior |
| **Iugu** | ~R$ 99/mês | 2,5%–3,4% | ~0,5% | R$ 1,50–2,00 | Sim | Sim | Integração | API limpa; mensalidade pesa no início |
| **Pagar.me** | Consulta | ~2,99%–3,5% | ~0,99%–1,5% | ~R$ 2–3 | Sim | Sim | Não | Stone; volume |
| **Vindi** | ~R$ 259/mês | ~2,5% | 0,5%+ | Incluso | Sim | Sim | Não | Dunning forte; caro agora |
| **Stripe** | Grátis | 3,99% + R$ 0,39 | 1,19% | Sim | Sim (+0,7%) | **Excelente** | Não | Melhor DX; mais cara |
| **Mercado Pago** | Grátis | ~3,79%–4,98% | ~0,49%–0,99% | Sim | Sim | Fraco | Não | Marca conhecida |

## Simulação (100 tenants × R$ 99 = R$ 9.900 MRR)

| Cenário | Custo mensal | % MRR |
| --- | --- | --- |
| Asaas 70% cartão / 30% Pix | ~R$ 255 | ~2,6% |
| Stripe 100% cartão | ~R$ 464 | ~4,7% |
| Iugu 70/30 | ~R$ 349 | ~3,5% |

## Pix Automático (2026)

Recorrência autorizada uma vez no app do banco — custo de Pix com previsibilidade de débito. Requisitos: CNPJ 6+ meses, planos de valor fixo (upgrade exige nova autorização). **Critério de desempate** na escolha do provedor.

## Recomendação (não vinculante)

1. **Asaas** para começar: zero mensalidade, Pix/boleto, NFS-e.
2. **Stripe** se priorizar velocidade e tolerar ~2 pp a mais.
3. **Vindi** só com MRR que justifique mensalidade.

## Interface (quando implementar)

Codar contra `PaymentProvider` com adapters. Regras:

- Webhook = fonte da verdade; retorno do browser nunca ativa assinatura.
- `webhook_events.provider_event_id UNIQUE` para idempotência.
- Job diário de reconciliação local × provedor.
- Nenhum dado de cartão no nosso servidor.

Ver contrato futuro em [modulos/08-billing-saas.md](../modulos/08-billing-saas.md) (fase 2).

## Fontes

- https://www.asaas.com/precos-e-taxas
- https://stripe.com/br/pricing
- https://www.bcb.gov.br — Pix Automático
