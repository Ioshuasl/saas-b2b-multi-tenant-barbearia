# RF — Financeiro da Barbearia (E5)

**Módulo:** `billing` · **Detalhe:** [modulos/05-financeiro.md](../../modulos/05-financeiro.md)

> Dinheiro **cliente → barbearia** no atendimento. A assinatura SaaS é o épico E8.

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E5-01 | Ao concluir atendimento (`COMPLETED`), usuário autorizado registra pagamento: valor em centavos e forma (`CASH`, `PIX`, `DEBIT`, `CREDIT`, `OTHER`) | Must | E7, J3 |
| RF-E5-02 | Valor efetivo pode divergir do preço tabelado (snapshot); fica registrado no pagamento | Must | J3 |
| RF-E5-03 | Um atendimento pode ter mais de um pagamento (divisão); no MVP o caso comum é um | Should | doc 07 |
| RF-E5-04 | Valores monetários são inteiros em centavos em toda a cadeia (sem ponto flutuante) | Must | doc 05/08, RNF-INT |
| RF-E5-05 | Comissão por profissional usa `%` cadastrado no `staff` sobre atendimentos `COMPLETED` do período | Must | US-05, E2 |
| RF-E5-06 | Totais financeiros consideram apenas atendimentos `COMPLETED` | Must | US-05 |
| RF-E5-07 | Pagamentos carregam `location_id` para relatório por unidade e consolidado | Must | E1b, US-07 |
| RF-E5-08 | `Idempotency-Key` em POST de pagamento crítico | Must | doc 08 |
| RF-E5-09 | `STAFF` vê apenas a própria comissão; não vê faturamento consolidado | Must | matriz RBAC |
| RF-E5-10 | Estorno/correção de pagamento exige motivo e autor (auditoria); MVP pode limitar a `OWNER`/`MANAGER` | Should | módulo billing |

## Critérios de aceite transversais (E5)

- Duplo POST com mesma `Idempotency-Key` → um pagamento.
- Soma de comissões do período bate com regra `% × total COMPLETED` do profissional.
- Sem caixa/sessão de caixa complexa no MVP (fora — ver backlog).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E5-11 | Caixa do dia com abertura/fechamento e sangria | Could (fase 2) |
| RF-E5-12 | Contas a pagar / DRE por unidade | Won't (MVP) |
| RF-E5-13 | Comanda com múltiplos itens e divisão avançada | Won't (MVP) |
| RF-E5-14 | NFS-e, maquininha integrada, conciliação bancária | Won't (MVP) |
