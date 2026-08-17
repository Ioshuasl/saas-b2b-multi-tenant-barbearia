# Riscos e Decisões em Aberto

> Decisões fechadas: `docs/adr/`. Este arquivo lista **pendências**, riscos e perguntas para o piloto.

## Decisões já tomadas (ADRs principais)

| ADR | Decisão |
| --- | --- |
| [0004](../adr/0004-orm-prisma.md) | Prisma (não Sequelize) |
| [0005](../adr/0005-whatsapp-cloud-api.md) | Cloud API como destino oficial (fase 2+) |
| [0006](../adr/0006-filas-bullmq.md) | BullMQ para jobs |
| [0007](../adr/0007-criptografia-envelope-tenant.md) | Envelope encryption por tenant |
| [0010](../adr/0010-billing-saas-manual-mvp.md) | Billing manual no MVP |
| [0016](../adr/0016-waha-default-messaging.md) | WAHA GOWS default messaging |

Multi-tenancy (`tenant_id` + RLS), monólito modular, trial 14 dias, multi-unidade no MVP, cliente sem conta (telefone), snapshot de preço no agendamento, `grace_until` negociado — ver [05 — Arquitetura](../05-arquitetura.md) e [07 — Modelo](../07-modelo-de-dados.md).

## Decisões pendentes

1. **Provedor de pagamento (fase 2)** — comparativo em [provedores-pagamento.md](./provedores-pagamento.md). Critério de desempate: **Pix Automático**. Até lá: billing manual (ADR-0010).
2. **Preços finais** — hipótese em [billing-planos.md](./billing-planos.md); validar com pilotos ([14 — Métricas](../14-metricas-kpis.md)).
3. **Homologação Meta / migração Cloud API** — quando e se migrar de WAHA; templates utility; limite por plano.
4. **Quantas unidades nos pilotos** — valida multi-unidade com cliente real vs. seed.

## Riscos

| Risco | Prob. | Impacto | Mitigação |
| --- | :-: | :-: | --- |
| Vazamento entre tenants | Baixa | **Fatal** | RLS + FK composta + CI isolamento + 2 tenants em dev |
| Vazamento entre unidades (mesmo tenant) | Média | Alto | Autorização em app + testes por endpoint; 404 fora do escopo |
| Overbooking | Média | Alto | `EXCLUDE`; teste concorrência; `409 SLOT_TAKEN` |
| Fuso / DST | **Alta** | Alto | `timestamptz`; timezone por unidade; testes DST |
| Número banido (WAHA) | **Alta** | Alto | Chip dedicado; ciência; só transacional; e-mail fallback |
| Sessão WAHA cai | Alta | Médio | Monitor + alerta; fallback e-mail |
| UI de rede complica loja única | Média | Alto | Unidade padrão; seletor oculto; onboarding ≤ 10 min |
| Query Prisma fora de transação tenant | Média | **Fatal** | `TenantPrisma` obrigatório; hook/teste |
| Inadimplência vira "nunca cobrar" | Média | Alto | Fila back-office + `grace_until` + revisão semanal |
| Barbearias não largam WhatsApp manual | Média | Alto | Piloto presencial; QR pronto; métrica `first_public_booking` |
| Onboarding longo → abandono | Média | Alto | Wizard; meta 10 min |
| Preço baixo demais | Média | Médio | Validar pilotos; planos por porte |
| Churn SMB | Média | Alto | Ativação + relatório que mostra valor |
| Custo WhatsApp oficial pós-migração | Baixa | Médio | Templates utility; limite por plano; e-mail default |
| Dependência de um fundador/dev | Alta | Alto | Docs, testes, IaC |

## Perguntas para o piloto

- Quantas barbearias piloto e quantas têm mais de uma unidade?
- Prazo até lançamento? ([13 — Roadmap](../13-roadmap-estimativas.md) ~4,5 meses / 1 dev)
- Time solo ou com ajuda?
- Barbearia-âncora pediu feature fora do escopo (comanda, estoque)?
- CNPJ 6+ meses para Pix Automático na fase 2?
