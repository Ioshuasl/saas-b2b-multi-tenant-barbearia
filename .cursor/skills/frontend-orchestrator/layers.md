# Frontend — referência rápida por camada

Norma: `docs/16` · `docs/09` · rules `frontend-*.mdc`.

## Types / Enum / Schema

- `types/<Entidade>/*Types.ts`
- `enum/<Entidade>/*Enum.ts`
- `schemas/<Entidade>/<Entidade>Schema.ts`
- Sem `interfaces/`

## Data / Service / Hook

- `CustomerListData.ts` → `CustomerListService.ts` → `useCustomerListHook.ts` (`useQuery`)
- Mutations: `useCustomerCreateHook` + `invalidateQueries`

## Components + Page

| Comp | Notas |
|------|-------|
| Index | Header + Table + dialogs; hooks Query |
| FormDialog | Modal; FormHook + `handleForm` |
| Form | Página |
| Table / Columns | Apresentacional |
| Page | Só compõe Index |

## Shared

`frontend/src/shared/` — 2+ consumidores; UI burra; api-client.
