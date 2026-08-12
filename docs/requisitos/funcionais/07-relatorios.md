# RF — Relatórios (E7)

**Módulo:** `reporting` · **Detalhe:** [modulos/07-relatorios.md](../../modulos/07-relatorios.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E7-01 | Relatório do período: faturamento, nº de atendimentos, ticket médio, taxa de no-show, top serviços | Must | US-05, E7 |
| RF-E7-02 | Relatório de comissão por profissional no período | Must | US-05 |
| RF-E7-03 | Filtros: período, profissional, `location_id` ou “todas” (consolidado da rede) | Must | US-07, E1b |
| RF-E7-04 | Totais consolidados batem com a soma das unidades | Must | US-07 |
| RF-E7-05 | `location_id=all` só para quem tem escopo total; caso contrário filtro reduzido ao escopo do usuário | Must | doc 06/08 |
| RF-E7-06 | `OWNER` vê consolidado da rede; `MANAGER` só suas unidades; `STAFF` só própria comissão/agenda | Must | matriz RBAC |
| RF-E7-07 | Exportação CSV do relatório (UTF-8; separador adequado a Excel pt-BR) | Must | US-05 |
| RF-E7-08 | Relatórios são somente leitura (CQRS-lite / views); não alteram domínio operacional | Must | doc 05 |
| RF-E7-09 | Consultas exigem período limitado (default razoável; máximo configurado) | Must | RNF-PERF |
| RF-E7-10 | Painel inicial do dono: resumo do dia (agendamentos, faturamento aproximado) | Should | J4 |
| RF-E7-11 | Relatório de ocupação / origem (público vs painel) | Should | doc 14 |
| RF-E7-12 | Exportação auditada (`REPORT_EXPORTED`) | Must | RNF-SEC / LGPD |

## Critérios de aceite transversais (E7)

- Soma do faturamento confere com soma dos pagamentos de atendimentos `COMPLETED` do período.
- Módulo nunca escreve em tabelas operacionais.
- p95 de APIs de relatório &lt; 300 ms ou exportação assíncrona se exceder (RNF-PERF).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E7-13 | BI / dashboards avançados | Could (fase 2) |
| RF-E7-14 | Metas por unidade / ranking de rede avançado | Could (fase 2) |
| RF-E7-15 | Data warehouse externo | Won't (MVP) |
