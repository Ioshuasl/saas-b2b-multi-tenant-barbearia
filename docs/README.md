# Documentação — SaaS B2B Multi-Tenant para Barbearias

Planejamento do MVP. Numeração alinhada ao prontuário odontológico de referência. Cada documento cobre uma dimensão da decisão de produto/engenharia.

**Stack de referência (fechada na Parte 1):** Node.js + TypeScript + Express · Prisma · PostgreSQL (RLS) · Next.js · monólito modular Orius (Clean Architecture + DDD + SOLID).

## Índice

| Documento | Conteúdo | Status |
| --- | --- | --- |
| [01 — Visão de Produto](./01-visao-produto.md) | Problema, proposta de valor, concorrentes, posicionamento | **Parte 6 ✅** |
| [02 — Benchmark de Mercado](./02-benchmark-mercado.md) | Trinks, Booksy, AppBarber, Belasis, Fresha | **Parte 2 ✅** |
| [03 — Personas e Jornadas](./03-personas-jornadas.md) | Personas, jornadas, RBAC | **Parte 6 ✅** |
| [04 — Escopo do MVP](./04-escopo-mvp.md) | Dentro/fora, user stories, DoD | **Parte 6 ✅** |
| [05 — Arquitetura](./05-arquitetura.md) | Monólito modular, camadas, Clean Architecture, SOLID | **Parte 1 ✅** |
| [06 — Multi-Tenancy](./06-multi-tenancy.md) | RLS, resolução de tenant, unidades, testes de isolamento | **Parte 1 ✅** |
| [07 — Modelo de Dados](./07-modelo-de-dados.md) | Prisma/DDL, RLS, EXCLUDE, envelope | **Parte 2 ✅** |
| [08 — API v1](./08-api-v1.md) | Contratos, superfícies, sem checkout no MVP | **Parte 2 ✅** |
| [09 — Frontend](./09-frontend.md) | Next.js, rotas, design system, telas críticas | **Parte 5 ✅** |
| [10 — Segurança, LGPD](./10-seguranca-lgpd-compliance.md) | AuthN/AuthZ, LGPD, DPA, incidente | **Parte 4 ✅** |
| [11 — Infra e DevOps](./11-infra-devops.md) | Hostinger, EasyPanel, CI/CD, filas, backup | **Parte 4 ✅** |
| [12 — Qualidade e Testes](./12-qualidade-testes.md) | Pirâmide, isolamento, DoD | **Parte 5 ✅** |
| [13 — Roadmap](./13-roadmap-estimativas.md) | Sprints S0–S8, marcos, riscos | **Parte 5 ✅** |
| [14 — Métricas](./14-metricas-kpis.md) | North star, funil, SaaS, ops, painéis | **Parte 4 ✅** |
| [15 — Glossário](./15-glossario.md) | Ubiquitous language | **Parte 5 ✅** |
| [16 — Estrutura de Pastas](./16-estrutura-de-pastas.md) | Padrão Orius, nomenclatura, exemplo Customer | **Parte 1 ✅** |
| [17 — Baseline de Segurança](./17-seguranca-baseline.md) | Envelope, anomalias, OWASP, Secure SDLC | **Parte 4 ✅** |

### ADRs

- [ADR-0001 — Monólito modular](./adr/0001-monolito-modular.md) ✅
- [ADR-0002 — Multi-tenancy + RLS](./adr/0002-multi-tenancy-rls.md) ✅
- [ADR-0003 — Versionamento da API](./adr/0003-versionamento-api.md) ✅
- [ADR-0004 — Prisma como ORM](./adr/0004-orm-prisma.md) ✅
- [ADR-0005 — WhatsApp Cloud API](./adr/0005-whatsapp-cloud-api.md) (**supersedido** pelo 0016)
- [ADR-0006 — Filas BullMQ + outbox](./adr/0006-filas-bullmq.md) ✅
- [ADR-0007 — Envelope encryption por tenant](./adr/0007-criptografia-envelope-tenant.md) ✅
- [ADR-0008 — VPS Hostinger + AWS S3](./adr/0008-hospedagem-vps-hostinger-s3.md) ✅
- [ADR-0009 — E-mail Resend](./adr/0009-email-resend.md) ✅
- [ADR-0010 — Billing SaaS manual no MVP](./adr/0010-billing-saas-manual-mvp.md) ✅
- [ADR-0011 — UUID v7 na aplicação](./adr/0011-uuid-v7-aplicacao.md) ✅
- [ADR-0012 — Observabilidade Sentry + logs](./adr/0012-observabilidade-sentry-logs.md) ✅
- [ADR-0013 — KEK/segredos locais na VPS](./adr/0013-kms-local-vps.md) ✅
- [ADR-0014 — Deploy EasyPanel; domínios app e api](./adr/0014-deploy-easypanel-dominios.md) ✅
- [ADR-0015 — Avaliação Evolution / OpenWA / WAHA](./adr/0015-avaliacao-gateways-whatsapp-nao-oficiais.md) ✅
- [ADR-0016 — WAHA (GOWS) default](./adr/0016-waha-default-messaging.md) ✅

Pesquisa: [pesquisa/README.md](./pesquisa/README.md) (billing fase 2, WAHA, riscos).

### Requisitos (Parte 3 ✅)

Catálogo rastreável — ver [requisitos/README.md](./requisitos/README.md). E6 (WAHA) e E8 (billing manual) alinhados aos ADRs na Parte 5.

- **Funcionais:** [Identidade](./requisitos/funcionais/01-identidade-acesso.md) · [Rede/unidades](./requisitos/funcionais/02-rede-unidades-cadastros.md) · [Clientes](./requisitos/funcionais/03-clientes.md) · [Agenda](./requisitos/funcionais/04-agenda.md) · [Financeiro](./requisitos/funcionais/05-financeiro.md) · [WhatsApp](./requisitos/funcionais/06-whatsapp-notificacoes.md) · [Relatórios](./requisitos/funcionais/07-relatorios.md) · [Billing SaaS](./requisitos/funcionais/08-billing-saas.md) · [Plataforma/LGPD](./requisitos/funcionais/09-plataforma-lgpd.md)
- **Não funcionais:** [RNF](./requisitos/nao-funcionais/requisitos-nao-funcionais.md) · [OWASP](./requisitos/nao-funcionais/RNF-seguranca-owasp.md)

### Módulos (Parte 2 ✅)

Detalhe por bounded context — [modulos/README.md](./modulos/README.md).

## Resumo executivo

**Produto:** plataforma SaaS onde cada barbearia (tenant) — com **uma ou várias unidades** — tem agenda online, página pública de agendamento por unidade, cadastro de profissionais/serviços e controle básico de caixa. Assinatura mensal por rede; **cobrança SaaS manual no MVP** ([ADR-0010](./adr/0010-billing-saas-manual-mvp.md)).

**MVP em uma frase:** o cliente final agenda sozinho pelo link da barbearia, o barbeiro vê a agenda do dia no celular, e o dono paga uma assinatura mensal.

**Estratégia multi-tenant:** banco único, schema único, `tenant_id` + RLS. A **unidade (`location`)** é fronteira operacional/autorização, não de isolamento.

**Meta do MVP:** 10 barbearias pagantes ativas em 90 dias após o lançamento.

## Decisões já tomadas (alinhamento documental)

| Tema | Decisão |
|---|---|
| Backend | Node.js + TypeScript + Express + **Prisma** |
| Frontend | React + TypeScript + Next.js |
| Arquitetura | Monólito modular Orius + Clean Architecture + DDD + SOLID |
| Banco | PostgreSQL com RLS por `tenant_id` |
| Multi-unidade | Dentro do MVP (`location_id` nas tabelas operacionais) |
| WhatsApp | **WAHA GOWS** default ([ADR-0016](./adr/0016-waha-default-messaging.md)); Cloud API só por env; e-mail (Resend) fallback obrigatório |
| Billing | **Manual no MVP** ([ADR-0010](./adr/0010-billing-saas-manual-mvp.md)); candidatos futuros Stripe / Mercado Pago / Asaas |
| Criptografia | Envelope encryption por tenant ([ADR-0007](./adr/0007-criptografia-envelope-tenant.md)); KEK local na VPS ([ADR-0013](./adr/0013-kms-local-vps.md)) |
| Hospedagem | VPS Hostinger + EasyPanel + S3 `sa-east-1` ([ADR-0008](./adr/0008-hospedagem-vps-hostinger-s3.md), [ADR-0014](./adr/0014-deploy-easypanel-dominios.md)) |
| Inadimplência | Prazo negociado caso a caso; nada desativado automaticamente |
| Sinal/pagamento antecipado | Fora do MVP |

## Como usar (após a documentação completa)

1. Leia `01`, `02`, `03` e `04` para o **o quê** e o posicionamento.
2. Use `requisitos/` como checklist de aceite; detalhe em `modulos/`.
3. Leia `10`, `17` e o ADR-0007 antes de implementar auth, dado pessoal ou multi-tenant.
4. Leia `05`, `06`, `16` e os ADRs base **antes** de escrever código.
5. Leia `09` (UI), `12` (DoD/testes) e `15` (linguagem) ao implementar telas e contratos.
6. Toda decisão técnica nova entra como ADR em `adr/`.

## Plano de partes restantes

| Parte | Conteúdo |
| --- | --- |
| **2** | API detalhada + `modulos/` + reescrita `07` + `02` benchmark ✅ |
| **3** | `requisitos/` RF + RNF ✅ (E6/E8 alinhados aos ADRs) |
| **4** | Segurança/LGPD, baseline, infra, métricas, ADRs de provedores ✅ |
| **5** | Frontend, testes, glossário, roadmap S0–S8 ✅ |
| **6** | Limpeza do legado (`01`/`03`/`04`, `pesquisa/`) ✅ |
