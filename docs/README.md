# Documentação — SaaS B2B Multi-Tenant para Barbearias

Planejamento do MVP. Cada documento cobre uma dimensão da decisão de produto/engenharia.

| # | Documento | Conteúdo |
|---|-----------|----------|
| 01 | [Visão de Produto](01-visao-produto.md) | Problema, proposta de valor, concorrentes, posicionamento |
| 02 | [Personas e Jornadas](02-personas-e-jornadas.md) | Quem usa, o que faz, fluxos ponta a ponta |
| 03 | [Escopo do MVP](03-escopo-mvp.md) | O que entra, o que fica fora, user stories e critérios de aceite |
| 04 | [Arquitetura e Multi-Tenancy](04-arquitetura-multi-tenancy.md) | Estratégia de isolamento, resolução de tenant, camadas |
| 05 | [Modelo de Dados](05-modelo-de-dados.md) | Entidades, relacionamentos, regras de integridade |
| 06 | [API e Contratos](06-api.md) | Endpoints REST do MVP, autenticação, erros |
| 07 | [Segurança e LGPD](07-seguranca-lgpd.md) | AuthN/AuthZ, RBAC, vazamento entre tenants, dados pessoais |
| 08 | [Billing e Planos](08-billing-planos.md) | Modelo de cobrança, planos, trial, inadimplência |
| 09 | [Stack e Infraestrutura](09-stack-infra.md) | Tecnologias, ambientes, CI/CD, observabilidade |
| 10 | [Roadmap de Entrega](10-roadmap.md) | Fases, sequenciamento, estimativas |
| 11 | [Métricas e Sucesso](11-metricas.md) | North star, funil, métricas SaaS |
| 12 | [Riscos e Decisões](12-riscos-decisoes.md) | ADRs tomadas, decisões pendentes, riscos e mitigação |
| 13 | [Provedores de Pagamento](13-provedores-pagamento.md) | Pesquisa de taxas (Asaas, Stripe, Pagar.me, Iugu, Vindi…), Pix Automático, recomendação |
| 14 | [WhatsApp e Notificações](14-whatsapp-notificacoes.md) | Evolution API em dev, comparativo de BSPs oficiais, custo e migração |

## Resumo executivo

**Produto:** plataforma SaaS onde cada barbearia (tenant) — com **uma ou várias unidades** — tem agenda online, página pública de agendamento por unidade, cadastro de profissionais/serviços e controle básico de caixa. Cobrança recorrente mensal por rede.

**MVP em uma frase:** o cliente final agenda sozinho pelo link da barbearia, o barbeiro vê a agenda do dia no celular, e o dono paga uma assinatura mensal.

**Estratégia multi-tenant escolhida:** banco único, schema único, discriminador `tenant_id` em todas as tabelas + Row Level Security no PostgreSQL. A **unidade (`location`)** é fronteira operacional e de autorização, não de isolamento. Justificativa e alternativas em [04](04-arquitetura-multi-tenancy.md).

**Meta do MVP:** 10 barbearias pagantes ativas em 90 dias após o lançamento.

## Decisões já tomadas

| Tema | Decisão |
|---|---|
| Backend | Node.js + TypeScript + Express + Sequelize |
| Frontend | React + TypeScript + Next.js |
| Banco | PostgreSQL com RLS por `tenant_id` |
| Multi-unidade | Dentro do MVP (`location_id` nas tabelas operacionais) |
| WhatsApp | Evolution API em dev/teste, atrás de interface trocável; API oficial depois |
| Inadimplência | Prazo negociado caso a caso; nada é desativado automaticamente |
| Sinal/pagamento antecipado | Fora do MVP |

**Em aberto:** provedor de pagamento ([13](13-provedores-pagamento.md)) e provedor oficial de WhatsApp ([14](14-whatsapp-notificacoes.md)). Ambos ficam atrás de interfaces (`PaymentProvider`, `WhatsAppProvider`) para que a decisão não bloqueie o desenvolvimento.
