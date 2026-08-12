---
name: designer-ux
description: >-
  Define fluxos e arquitetura de informação (Index, Form, Details, Sidebar)
  antes da UI visual. Use ao planejar telas do SaaS barbearias. Galeria visual
  Orius é provisória até o design system próprio. Lê no máximo 1–2 shards UI.
---

# Designer UX

Packages futuros: `operacional` / `financeiro` / `admin` / `messaging` / `public` (`docs/16`).
Em dúvida de jornada barbearia → perguntar e consultar `docs/03-personas-jornadas.md`.

## Política de tokens (obrigatória)

**Proibido:** monólito UI; tokens §1/`01` sem necessidade visual; Pencil (salvo pedido explícito de visual); shards Index/Table ao especificar só Details.

| Tarefa | Ler | Não ler |
|--------|-----|---------|
| Escolher tipo de tela / jornada | Esta SKILL; se faltar detalhe → [02-anatomia-fluxos.md](../../docs/ui/02-anatomia-fluxos.md) | `01`, `07`, Pencil |
| Spec Details vs Form / Sidebar | [05-sidebar-details.md](../../docs/ui/05-sidebar-details.md) | `03` Index/Table |
| Spec CRUD listagem | [03-crud-index-table.md](../../docs/ui/03-crud-index-table.md) | `05` salvo Details |

Índice: [`.cursor/docs/ui/INDEX.md`](../../docs/ui/INDEX.md)

## Escolher o tipo de tela

| Necessidade | Padrão |
|-------------|--------|
| Listar + CRUD | Fluxo secundário: Index + FormDialog/Confirm |
| Entidade longa / workflow | Fluxo principal: Form + Sidebar 360 (StepNavigator) |
| Consulta + ações pós-salvar | Details + DetailsSidebar |
| Cadastro auxiliar | FormDialog |
| Escolha com tabela | TableFormDialog |
| Lookup rico | SelectObject / InputGroup+busca |

## Fluxos (resumo)

**Secundário:** Header → Card DataTable → Confirm/FormDialog (estados: dados, skeleton, vazio, delete, ⋯).

**Principal:** Cards de etapa + Sidebar StepNavigator; etapa seguinte **visível porém bloqueada** até salvar a anterior.

**Details vs Form:** Form = edição + nav de seções; Details = consulta + ações na Sidebar. Não misturar no mesmo Card.

## Regras

- Tarefa operacional antes do visual; uma ação principal por contexto.
- Ordem: identidade → vínculos → valores → ação.
- Prever vazio, loading, erro, bloqueio, sucesso, confirmação, finalizado.
- Delete com confirmação explícita.

## Fluxo de trabalho

1. Objetivo, usuário, contexto.
2. Classificar tipo de tela.
3. Mapear jornada + estados (ler no máx. 1 shard se SKILL não bastar).
4. Entregar spec para `designer-ui` e/ou `frontend-orchestrator`.

## Checklist

- [ ] Tipo de tela correto?
- [ ] Estados e progressive disclosure?
- [ ] Spec implementável sem comportamento invisível?
