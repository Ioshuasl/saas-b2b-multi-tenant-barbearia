---
name: designer-ui
description: >-
  Cria e ajusta camada visual no Pencil (.pen). Por enquanto usa a galeria/tokens
  Orius (padrao-ui-ux-orius-pencil.pen); o design system definitivo do SaaS
  de barbearias será definido futuramente. Lê no máximo 1 shard de tokens + 1 frame.
---

# Designer UI (galeria Orius — provisória)

Projeto: SaaS barbearias multi-tenant. Paths de app futuro: `frontend/`.  
UI Pencil própria será feita depois; até lá, seguir galeria Orius abaixo.

## Política de tokens (obrigatória)

**Proibido:** ler monólito UI; ler vários shards; abrir **mais de 1 frame** Pencil por turno; carregar rules/skills de CRUD frontend sem necessidade.

| Tarefa | Ler | Não ler |
|--------|-----|---------|
| Ajuste visual / novo frame | [01-tokens-kit.md](../../docs/ui/01-tokens-kit.md) + **1 frame** Pencil | outros shards; frontend rules |
| Só tokens/átomos | `01` + frame kit `00` | fluxos longos (`02`–`05`) |

Índice: [`.cursor/docs/ui/INDEX.md`](../../docs/ui/INDEX.md)  
Princípios curtos (só se não for implementar frame): `ui-ux-systems`.

## Pencil — 1 frame por turno

| Necessidade | Frame |
|-------------|-------|
| Átomos | 00 — Kit / 00b |
| Tabs / Sidebar | 01 |
| Dialog / Details actions | 02 |
| CRUD estados | 03 — Fluxo secundário |
| Workflow | 04 — Fluxo principal |
| Página Index / Form+Sidebar / Details / FormDialog | frames “Página — …” |

Galeria: `padrao-ui-ux-orius-pencil.pen` (MCP Pencil only — nunca Read/Grep `.pen`).

## Tokens (resumo; detalhe em `01`)

- Primary `#FF781F` · Foreground `#272F32` · Background `#FCFCFC` · Border `#E5E5E5` · Destructive `#E7000B`
- Button/Input h 40, radius-md 8; Card/Dialog radius-xl 14; Inter

## Regras

- Hierarquia antes de efeitos; reutilizar galeria; estados (loading/vazio/erro/bloqueio/sucesso).
- Header: título + descrição + 1 primary; footer dialog: outline + primary.
- Sidebar Form/Details: 360 sticky (≠ nav do app).
- Não alterar fluxo/IA/copy sem registrar para `designer-ux`.

## Fluxo

1. Briefing + `01` (se preciso).
2. Abrir **um** frame na galeria.
3. Aplicar layout/tokens/estados.
4. Resumo para `frontend-orchestrator` / `ui-refactor`.

## Checklist

- [ ] Tokens/componentes da galeria?
- [ ] Um primary por zona; estados previstos?
- [ ] Pronto para `app/`?
