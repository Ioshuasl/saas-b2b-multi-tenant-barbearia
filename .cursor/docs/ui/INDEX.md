# UI/UX — índice (economia de tokens)

**Projeto:** SaaS barbearias multi-tenant.  
**Paths:** `frontend/` · packages `operacional` / `financeiro` / `admin` / `messaging` / `public`.  
**Norma de código:** `docs/16`, `docs/09`.

**Tokens / galeria Pencil:** provisórios (base Orius) até o design system definitivo.  
**Proibido:** ler o stub monólito ou vários shards “por precaução”.  
**Obrigatório:** ler só o(s) arquivo(s) da matriz.

Cheat sheet: `.cursor/skills/ui-ux-systems/SKILL.md`  
Galeria (futura/provisória): `padrao-ui-ux-orius-pencil.pen` (MCP Pencil; **1 frame por turno**).

## Matriz tarefa → arquivo

| Tarefa | Ler |
|--------|-----|
| Tokens, Button/Input/Card, hierarquia de ações | [01-tokens-kit.md](01-tokens-kit.md) |
| Anatomia de página, fluxos, copy | [02-anatomia-fluxos.md](02-anatomia-fluxos.md) |
| Index + Table + Columns (CRUD listagem) | [03-crud-index-table.md](03-crud-index-table.md) |
| Form / FormDialog / grid | [04-form-dialog.md](04-form-dialog.md) |
| Sidebar 360 + Details / atendimento | [05-sidebar-details.md](05-sidebar-details.md) |
| Select / empty / loading | [06-select-estados.md](06-select-estados.md) |
| Qual componente de `frontend/src/shared/ui` usar | [07-ui-components-map.md](07-ui-components-map.md) |

Máximo típico por turno: **1–2 shards**.

## Hábitos de prompt

- Mencionar skill **e** tipo: `frontend-orchestrator, só Index CRUD Customer`.
- Evitar “segue o padrão UI completo” sem escopo.
- Não misturar `designer-ui` + `frontend-orchestrator` + vários shards no mesmo turno.
- Backend: `backend-orchestrator` → só rules das camadas (não shards UI).

## Pencil (1 frame) — galeria provisória

| Necessidade | Frame |
|-------------|-----------------|
| Átomos | 00 — Kit |
| Tabs / Sidebar | 01 |
| CRUD / Index | 03 / Página Index |
| Form + Sidebar | Página Form+Sidebar |
| Details | Página Details |
| FormDialog | Página FormDialog |
