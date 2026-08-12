# Requisitos — SaaS B2B Multi-Tenant para Barbearias

Catálogo de **requisitos funcionais (RF)** e **não funcionais (RNF)** do MVP, derivado do escopo e dos documentos de planejamento.

## Escopo desta pasta

| Inclui | Não inclui |
| --- | --- |
| O que o sistema deve fazer (RF) e com que qualidade (RNF) no MVP | Detalhe de domínio/API (ver `docs/modulos/`, `08-api-v1.md`) |
| Prioridade, rastreabilidade e critérios de aceite | Decisões de stack (ver ADRs e `05-arquitetura.md`) |
| Itens explicitamente fora do MVP (marcados Fase 2/3) | Backlog de implementação sprint a sprint |

**Fonte normativa:** [04 — Escopo do MVP](../04-escopo-mvp.md), [03 — Personas e Jornadas](../03-personas-jornadas.md), módulos em `docs/modulos/` (Parte 2), [10 — Segurança/LGPD](../10-seguranca-lgpd-compliance.md), [11 — Infra](../11-infra-devops.md), [06 — Multi-Tenancy](../06-multi-tenancy.md), [14 — Métricas](../14-metricas-kpis.md). Material de pesquisa: [pesquisa/](../pesquisa/).

## Convenções

| Campo | Significado |
| --- | --- |
| **ID** | `RF-<ÉPICO>-<NN>` ou `RNF-<CATEGORIA>-<NN>` — estável; não reutilizar IDs removidos |
| **Prioridade** | `Must` = obrigatório no MVP · `Should` = desejável no MVP se couber · `Could` = fase 2+ · `Won't` = fora de escopo |
| **Rastreabilidade** | User story (`US-0x`), jornada (`Jx`), módulo ou ADR |
| **Status** | `Planejado` (padrão) · `Em implementação` · `Atendido` · `Adiado` |

Prioridade segue MoSCoW alinhada ao [escopo do MVP](../04-escopo-mvp.md). Itens Fase 2/3 aparecem com prioridade `Could`/`Won't` apenas para rastreio, sem compromisso de entrega no MVP.

## Índice — Requisitos funcionais

| Arquivo | Épico | Módulo |
| --- | --- | --- |
| [01 — Identidade e acesso](./funcionais/01-identidade-acesso.md) | E1 | `identity` |
| [02 — Rede, unidades e cadastros](./funcionais/02-rede-unidades-cadastros.md) | E2 | `locations` |
| [03 — Clientes](./funcionais/03-clientes.md) | E3 | `customers` |
| [04 — Agenda e página pública](./funcionais/04-agenda.md) | E4 | `scheduling` |
| [05 — Financeiro da barbearia](./funcionais/05-financeiro.md) | E5 | `billing` |
| [06 — WhatsApp e notificações](./funcionais/06-whatsapp-notificacoes.md) | E6 | `messaging` |
| [07 — Relatórios](./funcionais/07-relatorios.md) | E7 | `reporting` |
| [08 — Billing SaaS](./funcionais/08-billing-saas.md) | E8 | `subscription` |
| [09 — Plataforma e LGPD](./funcionais/09-plataforma-lgpd.md) | E9 | `platform` |

> Sem épicos de prontuário clínico ou orçamentos de tratamento — fora do domínio.

## Índice — Requisitos não funcionais

| Arquivo | Categorias |
| --- | --- |
| [Requisitos não funcionais](./nao-funcionais/requisitos-nao-funcionais.md) | Desempenho, disponibilidade, escala, segurança, privacidade, integridade, usabilidade, acessibilidade, i18n, compatibilidade, observabilidade, backup/DR, manutenibilidade |
| [Checklist OWASP / API Security](./nao-funcionais/RNF-seguranca-owasp.md) | OWASP Top 10, API Top 10, envelope crypto, anomalias |

Baseline operacional: [10 — LGPD](../10-seguranca-lgpd-compliance.md) · [17 — Segurança Enterprise](../17-seguranca-baseline.md) (Parte 4) · [ADR-0002](../adr/0002-multi-tenancy-rls.md) · [ADR-0007](../adr/0007-criptografia-envelope-tenant.md) (Parte 4).

## Como usar

1. Antes de implementar um épico, leia o RF correspondente + o módulo em `docs/modulos/` (quando existir).
2. Critérios de aceite aqui são o contrato de produto; detalhes de endpoint ficam em [08 — API v1](../08-api-v1.md).
3. RNFs aplicam-se a **todos** os RF, salvo indicação contrária.
4. Mudança de escopo: atualizar o RF/RNF **e** o [04 — Escopo](../04-escopo-mvp.md) (ou criar ADR se for decisão técnica).

## Critério de “MVP pronto” (produto)

Três barbearias piloto usam o sistema em produção por **2 semanas** sem incidente de dados; o dono opera o dia a dia (agenda + página pública + relatório) sem caderno/WhatsApp paralelo — ver [04 — Definition of Done](../04-escopo-mvp.md).
