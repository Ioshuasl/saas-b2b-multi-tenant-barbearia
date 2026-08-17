# Módulo — Financeiro da barbearia (`billing`)

## 1. Responsabilidade

Dinheiro **cliente → barbearia** no atendimento: registro de pagamento, estorno e insumo de comissão/relatório.

Não confundir com [`subscription`](./08-billing-saas.md) (plataforma → barbearia). Sem caixa do dia, contas a pagar, NFS-e ou maquininha no MVP.

## 2. Regras invioláveis

1. Dinheiro é `bigint` em centavos. Nunca float.
2. Totais de faturamento/comissão consideram só atendimentos `COMPLETED` e pagamentos **não** estornados.
3. Estorno em vez de exclusão: motivo, autor, `reversed_at`.
4. Toda escrita com `Idempotency-Key`.
5. `location_id` no pagamento (relatório por unidade e consolidado).
6. Valor pago **pode** divergir do snapshot do agendamento (desconto/gorjeta informal); fica no `amount_cents`.

## 3. Formas (MVP)

`CASH` | `PIX` | `DEBIT` | `CREDIT` | `OTHER`.

Um atendimento pode ter N pagamentos (divisão); o caso comum é um, ao concluir.

## 4. Comissão

Não há tabela `commission_entry` no MVP. Relatório deriva:

```
commissionCents = floor(sum(payments.amount_cents where COMPLETED e não estornado) * staff.commission_percent / 100)
```

`STAFF` vê só a própria linha. `OWNER`/`MANAGER` veem a equipe no escopo.

## 5. Casos de uso

| Use case | Notas |
| --- | --- |
| `CreateService` (payment) | Ligado a `appointment_id`; exige status `COMPLETED` (ou transiciona+paga no mesmo fluxo do painel) |
| `ReverseService` | `OWNER`/`MANAGER`; motivo ≥ 10 |

## 6. API pública

```ts
export interface BillingModuleApi {
  totalSpentCents(ctx: RequestContext, customerId: EntityId): Promise<number>;
  receivedCents(ctx: RequestContext, filter: { from: Date; to: Date; locationId?: EntityId; staffId?: EntityId }): Promise<number>;
}
```
