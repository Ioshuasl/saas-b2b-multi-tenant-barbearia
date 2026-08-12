# Documentação — SaaS B2B Multi-Tenant para Barbearias

Planejamento do MVP. Numeração alinhada ao prontuário odontológico de referência. Cada documento cobre uma dimensão da decisão de produto/engenharia.

**Stack de referência (fechada na Parte 1):** Node.js + TypeScript + Express · Prisma · PostgreSQL (RLS) · Next.js · monólito modular Orius (Clean Architecture + DDD + SOLID).

## Índice

| Documento | Conteúdo | Status |
| --- | --- | --- |
| [01 — Visão de Produto](./01-visao-produto.md) | Problema, proposta de valor, concorrentes, posicionamento | legado (revisar depois) |
| 02 — Benchmark de Mercado | Análise aprofundada de concorrentes | **pendente** |
| [03 — Personas e Jornadas](./03-personas-jornadas.md) | Personas, jornadas, RBAC | legado (renomeado) |
| [04 — Escopo do MVP](./04-escopo-mvp.md) | Dentro/fora, user stories, DoD | legado (renomeado) |
| [05 — Arquitetura](./05-arquitetura.md) | Monólito modular, camadas, Clean Architecture, SOLID | **Parte 1 ✅** |
| [06 — Multi-Tenancy](./06-multi-tenancy.md) | RLS, resolução de tenant, unidades, testes de isolamento | **Parte 1 ✅** |
| [07 — Modelo de Dados](./07-modelo-de-dados.md) | Entidades (conteúdo antigo; reescrever com Prisma/DDL) | legado → Parte 2+ |
| [08 — API v1](./08-api-v1.md) | Contratos (conteúdo antigo; expandir na Parte 2) | legado → Parte 2 |
| 09 — Frontend | Next.js, rotas, design system | **pendente** |
| [10 — Segurança, LGPD](./10-seguranca-lgpd-compliance.md) | AuthN/AuthZ, LGPD (reescrever na Parte 4) | legado → Parte 4 |
| [11 — Infra e DevOps](./11-infra-devops.md) | Stack/infra (atualizar Prisma + ADRs Hostinger na Parte 4) | legado → Parte 4 |
| 12 — Qualidade e Testes | Pirâmide, isolamento, DoD | **pendente** |
| [13 — Roadmap](./13-roadmap-estimativas.md) | Fases e marcos | legado |
| [14 — Métricas](./14-metricas-kpis.md) | North star, funil (reescrever na Parte 4) | legado → Parte 4 |
| 15 — Glossário | Ubiquitous language | **pendente** (Parte 4) |
| [16 — Estrutura de Pastas](./16-estrutura-de-pastas.md) | Padrão Orius, nomenclatura, exemplo Customer | **Parte 1 ✅** |
| 17 — Baseline de Segurança | Envelope encryption, OWASP, Secure SDLC | **pendente** (Parte 4) |

### ADRs (Parte 1)

- [ADR-0001 — Monólito modular](./adr/0001-monolito-modular.md) ✅
- [ADR-0002 — Multi-tenancy + RLS](./adr/0002-multi-tenancy-rls.md) ✅
- [ADR-0003 — Versionamento da API](./adr/0003-versionamento-api.md) ✅
- [ADR-0004 — Prisma como ORM](./adr/0004-orm-prisma.md) ✅ (substitui Sequelize)
- [ADR-0011 — UUID v7 na aplicação](./adr/0011-uuid-v7-aplicacao.md) ✅
- Demais ADRs (BullMQ, envelope, Hostinger, Resend, WhatsApp, billing, observabilidade, KMS, EasyPanel) → Parte 4

### Requisitos (Parte 3 ✅)

Catálogo rastreável — ver [requisitos/README.md](./requisitos/README.md).

- **Funcionais:** [Identidade](./requisitos/funcionais/01-identidade-acesso.md) · [Rede/unidades](./requisitos/funcionais/02-rede-unidades-cadastros.md) · [Clientes](./requisitos/funcionais/03-clientes.md) · [Agenda](./requisitos/funcionais/04-agenda.md) · [Financeiro](./requisitos/funcionais/05-financeiro.md) · [WhatsApp](./requisitos/funcionais/06-whatsapp-notificacoes.md) · [Relatórios](./requisitos/funcionais/07-relatorios.md) · [Billing SaaS](./requisitos/funcionais/08-billing-saas.md) · [Plataforma/LGPD](./requisitos/funcionais/09-plataforma-lgpd.md)
- **Não funcionais:** [RNF](./requisitos/nao-funcionais/requisitos-nao-funcionais.md) · [OWASP](./requisitos/nao-funcionais/RNF-seguranca-owasp.md)

### Pastas ainda pendentes

- `docs/modulos/` — detalhamento por bounded context (Parte 2)
- `docs/pesquisa/` — material legado preservado (billing, provedores, WhatsApp, ADRs inline antigos)

## Resumo executivo

**Produto:** plataforma SaaS onde cada barbearia (tenant) — com **uma ou várias unidades** — tem agenda online, página pública de agendamento por unidade, cadastro de profissionais/serviços e controle básico de caixa. Cobrança recorrente mensal por rede (`PaymentProvider`; primeiros tenants com billing manual).

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
| WhatsApp | Evolution API **ou** WAHA em dev/teste; API oficial depois (escolha Evolution×WAHA pendente) |
| Billing | Interface `PaymentProvider` (Stripe / Asaas / Mercado Pago); primeiros tenants configurados manualmente |
| Criptografia | Envelope encryption por tenant (reaproveitar do odontológico — ADR na Parte 4) |
| Hospedagem | Reaproveitar ADRs do odontológico (VPS Hostinger + EasyPanel + S3) — detalhar na Parte 4 |
| Inadimplência | Prazo negociado caso a caso; nada desativado automaticamente |
| Sinal/pagamento antecipado | Fora do MVP |

## Como usar (após a documentação completa)

1. Leia `01`, `03` e `04` para o **o quê**.
2. Use `requisitos/` como checklist de aceite; detalhe em `modulos/`.
3. Leia `05`, `06`, `16` e os ADRs base **antes** de escrever código.
4. Toda decisão técnica nova entra como ADR em `adr/`.

## Plano de partes restantes

| Parte | Conteúdo |
| --- | --- |
| **2** | API detalhada + `modulos/` |
| **3** | `requisitos/` RF + RNF ✅ |
| **4** | Segurança/LGPD, baseline, infra, métricas, glossário, ADRs restantes |
| **5** | Integração final do índice + limpeza do legado |
