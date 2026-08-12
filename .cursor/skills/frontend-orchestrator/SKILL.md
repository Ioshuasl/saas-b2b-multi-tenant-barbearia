---
name: frontend-orchestrator
description: >-
  Orquestra telas CRUD no frontend Next.js por camadas (types, enum, schema,
  data, service, hook TanStack Query, components, page). Use ao criar ou ajustar
  UI em frontend/. Fonte: docs/16 + docs/09 + rules .cursor.
---

# Frontend Orchestrator

## Objetivo

Implementar/corrigir `frontend/` no fluxo:

`Page → Component → Hook → Service → Data → API`

## Política de tokens

**Ordem:** classificar tipo de tela → rules das camadas → no máx. **1–2** shards em `.cursor/docs/ui/` → implementar → [checklist.md](checklist.md) no fim.  
[layers.md](layers.md) só se a camada não estiver clara.

## Gate de pergunta (obrigatório)

**Nunca tomar decisão de forma autônoma.** Em dúvida, ambiguidade ou **qualquer escolha** (tipo de tela, package, campos do form, modal vs página, copy, navegação, contrato com a API, etc.) → **perguntar ao usuário e pausar** até a resposta.

Só segue sem perguntar o que já está **explícito** na instrução do usuário ou **fechado** em `docs/` / rules (ex.: fluxo Page→…→Data, TanStack Query no Hook, `*Form` vs `*FormDialog`).

| Perguntar (sempre) | Seguir sem perguntar |
|--------------------|----------------------|
| Dúvida ou 2+ caminhos válidos | Convenção já normativa em `docs/16` / `docs/09` / rules |
| Package, tipo de tela, shape de UI ambíguos | Ops List/Get/Create/Update/Delete já definidas |
| Campos, validação ou fluxo de UX não especificado | — |

## Execução

1. Classificar package + entidade + tipo de tela + operações (`List|Get|Create|Update|Delete`).
2. Ler rules afetadas.
3. Implementar: types/enum/schema → data → service → hooks (Query/Mutation) → components → page.
4. Checklist + lint se disponível.

## Rules

Ver `rules/frontend.mdc` e `frontend-*.mdc`.

## Regras críticas

- **Nunca decidir sozinho** — dúvida ou escolha → perguntar e pausar.
- Monólito modular (packages) + Clean no fluxo + SOLID; código simples/direto — sem over-engineering.
- Data = único HTTP; Hook = TanStack Query; sem CollectionHook obrigatório.
- Tipagens em `types/`; enums em `enum/`; sem `interfaces/`.
- PascalCase nos arquivos; `*Form` vs `*FormDialog`.
- Package não importa outro package.
- UI não duplica invariantes de domínio do backend.

## Saída

```
Implementado: [resumo]
Arquivos: [lista]
Validação: [lint/pendências]
Bloqueios: [se houver]
```
