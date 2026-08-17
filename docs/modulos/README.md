# Módulos (bounded contexts)

Detalhe de domínio por módulo do monólito. Contratos HTTP em [08 — API v1](../08-api-v1.md); DDL em [07 — Modelo de dados](../07-modelo-de-dados.md); aceite em [requisitos/](../requisitos/). Cruzar módulos **somente** por `*_public.ts`.

| Arquivo | Módulo | RF |
| --- | --- | --- |
| [01 — Identidade](./01-identidade-acesso.md) | `identity` | E1 |
| [02 — Rede e cadastros](./02-rede-unidades-cadastros.md) | `locations` | E2 |
| [03 — Clientes](./03-clientes.md) | `customers` | E3 |
| [04 — Agenda](./04-agenda.md) | `scheduling` | E4 |
| [05 — Financeiro](./05-financeiro.md) | `billing` | E5 |
| [06 — WhatsApp](./06-whatsapp-notificacoes.md) | `messaging` | E6 |
| [07 — Relatórios](./07-relatorios.md) | `reporting` | E7 |
| [08 — Billing SaaS](./08-billing-saas.md) | `subscription` | E8 |
| [09 — Plataforma](./09-plataforma.md) | `platform` / `shared/` | E9 |

Sem prontuário clínico nem orçamentos de tratamento.
