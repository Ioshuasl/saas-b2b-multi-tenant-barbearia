# Cursor — Agentes (SaaS Barbearias)

Configura agents para `backend/` e `frontend/`.

**Fonte normativa do produto:** `docs/` (sobretudo `docs/16-estrutura-de-pastas.md`, `docs/05-arquitetura.md`, `docs/09-frontend.md`).

## Rules

| Arquivo | Escopo |
|---------|--------|
| `rules/project-core.mdc` | Sempre |
| `rules/backend.mdc` | `backend/**` |
| `rules/frontend.mdc` | `frontend/**` |
| `rules/backend-*.mdc` | Por camada + modules / workers / shared |
| `rules/frontend-*.mdc` | Por camada (types, enum, schema, data, service, hook, components, page, shared) |

## Skills

| Skill | Quando |
|-------|--------|
| `backend-orchestrator` | CRUD / casos de uso em `backend/` — checklist no **fim** |
| `frontend-orchestrator` | CRUD / telas em `frontend/` + 1 shard UI — checklist no **fim** |
| `ui-ux-systems` | Cheat sheet UI (sem codar um tipo) |
| `ui-refactor` | Refator visual com 1 shard |
| `designer-ui` | Pencil: **1 frame** + `01-tokens-kit` (galeria Orius — futura) |
| `designer-ux` | Fluxo/tipo de tela (+ `02` ou `05` se preciso) |
| `pencil-tsx-recreate` | Recriar `.tsx` → `.pen` |
| `git` | Branch e commit no **repo único** deste projeto |

## UI/UX (progressive disclosure)

| Arquivo | Uso |
|---------|-----|
| [`docs/ui/INDEX.md`](docs/ui/INDEX.md) | Matriz tarefa → shard |
| `docs/ui/0N-*.md` | Detalhe pontual (máx. 1–2 por turno) |

UI Pencil/Orius visual será refinada futuramente; skills de design permanecem disponíveis.

## Arquitetura

- **Sempre:** monólito modular + DDD + Clean Architecture + SOLID + código simples/direto (sem verbosidade)
- Backend: `Routes → Controller → Service → [Action?] → Repository` (+ `models/` / `types/` / `enum/`)
- `Action` **somente** quando há efeito além do repositório
- Frontend: `Page → Component → Hook (TanStack Query) → Service → Data → API`
- Tipagens em `types/`; enums em `enum/` — **sem pasta `interfaces/`**
- Ops CRUD: `list` / `get` / `create` / `update` / `delete`
- Classes curtas (`CreateService`); arquivo backend `snake_case`; frontend `PascalCase`

Padrões bloqueantes: `project-core.mdc` + rules da camada + `docs/16`.
