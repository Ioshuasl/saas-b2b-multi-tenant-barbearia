---
name: ui-ux-systems
description: >-
  Cheat sheet UI/UX (galeria Orius provisória). Use ao revisar padrão sem
  implementar um tipo de tela. Detalhe: shards em .cursor/docs/ui/ (nunca o
  monólito). Design system definitivo do SaaS barbearias virá depois.
---

# UI e UX (tokens Orius provisórios → SaaS barbearias)

## Política de tokens

- Esta skill é o **resumo**. Detalhe: [`.cursor/docs/ui/INDEX.md`](../../docs/ui/INDEX.md) → **um** shard.
- **Proibido** ler o stub monólito ou vários shards de uma vez.
- Em CRUD: preferir shard da matriz do `frontend-orchestrator`.
- Paths: `frontend/` · packages por área (`operacional`, `financeiro`, `admin`, …) · `docs/16`.

## Princípios

1. Clareza acima de efeito.
2. Densidade controlada; progressive disclosure.
3. Cor semântica; mentalidade operacional.
4. Consistência Index / Form / Details / Sidebar.

## Tokens (light)

| Token | Valor |
|-------|-------|
| primary | `#FF781F` |
| foreground | `#272F32` |
| background | `#FCFCFC` |
| muted / border | `#F5F5F5` / `#E5E5E5` |
| destructive | `#E7000B` |

Button/Input h 40; Card radius-xl 14. Tipografia Inter.

## Anatomia

Header: título + descrição + **1** CTA primary. Busca no card, não no header.

| Tela | Layout |
|------|--------|
| CRUD | Header + Card DataTable |
| Form longo | Main + Sidebar sticky 360 |
| Details | Main + Sidebar de ações |
| Dialog | Overlay + card |

## Família de domínio

Index · Table/Columns · Form · FormDialog · TableFormDialog · Sidebar (≠ `ui/sidebar`) · StepNavigator · Details

## Ações

Primary / outline / destructive — **nunca** dois primary no mesmo footer.

## Estados

Skeleton · Empty · bloqueio visível com pré-requisito · AlertDialog delete · finalizado gated.

## Relação

- Detalhe: shards `docs/ui/`
- Visual Pencil: `designer-ui` (1 frame)
- Fluxo: `designer-ux`
- CRUD: `frontend-orchestrator`
- Refactor: `ui-refactor`
