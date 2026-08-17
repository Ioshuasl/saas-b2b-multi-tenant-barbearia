# Módulo — Relatórios (`reporting`)

## 1. Responsabilidade

Leituras agregadas para o dono operar o dia e fechar o mês: faturamento, volume, ticket, no-show, top serviços, comissão, visão por unidade e consolidado da rede.

**Não escreve** em tabelas operacionais (CQRS-lite). Views `security_invoker` herdam RLS.

## 2. Regras

1. Período obrigatório, teto configurado (ex.: 92 dias); além disso, exportação assíncrona.
2. `locationId=all` só com escopo total; senão o filtro reduz ao `user_locations` (sem vazar existência de outras lojas).
3. Totais consolidados = soma das unidades (teste de aceite US-07).
4. Faturamento = pagamentos não estornados de `COMPLETED`.
5. `STAFF` só própria comissão/agenda; `MANAGER` suas unidades; `OWNER` a rede.
6. CSV UTF-8; exportação auditada (`REPORT_EXPORTED`).
7. p95 &lt; 300 ms ou `202` + job.

## 3. Relatórios do MVP

| Endpoint | Conteúdo |
| --- | --- |
| `GET /reports/summary` | Atendimentos, faturamento, ticket, no-show, top serviços |
| `GET /reports/commissions` | % × recebido COMPLETED por staff |
| `GET /reports/by-location` | Mesmas métricas por unidade (OWNER) |
| Dashboard (Should) | Resumo do dia na home |

Origem público vs painel e ocupação: Should (RF-E7-11).

## 4. Fontes

Views em [07](../07-modelo-de-dados.md) §8 + queries parametrizadas. Números de produto (ativação, no-show do piloto) também em SQL — [doc 14](../14-metricas-kpis.md); Sentry não é fonte da verdade de KPI.
