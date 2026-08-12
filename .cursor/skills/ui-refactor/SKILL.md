---
name: ui-refactor
description: >-
  Refatora UI React/Next.js em frontend/ alinhando a shards docs/ui, preservando
  contratos/hooks/services. Use para layout/copy/a11y sem mudar arquitetura.
  Tokens Orius provisórios até o DS definitivo.
---

# UI/UX Refactor (Frontend)

Paths: `frontend/src/packages/**` e `frontend/src/shared/**`.
Arquitetura: `.cursor/rules/frontend-*.mdc` + `docs/09` / `docs/16`.

## Política de tokens

Ler **só** o shard do tipo de tela (matriz em [docs/ui/INDEX.md](../../docs/ui/INDEX.md)). Não ler monólito nem `ui-ux-systems` + shard juntos.

| Tela | Shard |
|------|-------|
| Index/Table | `03-crud-index-table.md` |
| Form/Dialog | `04-form-dialog.md` |
| Sidebar/Details | `05-sidebar-details.md` |
| Tokens/átomos | `01-tokens-kit.md` |

Arquitetura: `.cursor/rules/frontend-*.mdc` das camadas tocadas.

## Missão

Melhorar visual/UX/copy/a11y alinhado ao padrão — **sem** mudar payloads, hooks, services ou o fluxo de camadas.

## Precedência

1. Segurança/dados → 2. Pedido do usuário → 3. Contratos → 4. Escopo → 5. Shard UI + rules → 6. Código (só com autorização)

## Tipos

- **A** pontual · **B** estrutural de tela · **C** incerto → investigar antes

## Fases

`ENQUADRAR → PROTEGER → INVESTIGAR → PLANEJAR → EXECUTAR → VALIDAR → REPORTAR`

- Investigar: componente + **1 shard** + rules.
- Executar: diff mínimo; preservar Collection/FormHook/`handleForm`/modais condicionais.
- Validar: lint + checklist do shard/`INDEX` (não monólito).

## Não faça

Alterar hooks/services sem autorização; inventar APIs; ampliar escopo; commit sem pedido.

## Saída

```
Escopo: [A|B|C]
Shard UI: [arquivo]
Arquivos: [lista]
Preservado: [contratos]
Validação: [lint]
```
