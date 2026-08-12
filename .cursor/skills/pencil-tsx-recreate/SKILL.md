---
name: pencil-tsx-recreate
description: >-
  Recria componentes React/TSX no Pencil MCP com fidelidade visual
  (Shadcn + Tailwind → .pen). Use ao recriar Form/Dialog/Index/Table
  no canvas Pencil a partir de frontend/**/*.tsx.
---

# Pencil ← TSX (fidelidade visual)

Recria a UI de um `.tsx` no canvas Pencil. Paths do projeto: `frontend/` (não `app/`).

**Não** gera código em `frontend/`. **Não** substitui `designer-ui` nem `frontend-orchestrator`.

## Prompt canônico (aplicar verbatim)

Usando as ferramentas MCP do Pencil conectadas ao canvas ativo, recrie o formulário React contido em @[Arquivo].tsx com 100% de fidelidade visual.Siga estas regras de mapeamento do Shadcn UI + Tailwind:Mapeamento de Primitivos: Identifique componentes do Shadcn (Card, Input, Label, Button, Select) e desenhe-os no Pencil respeitando o design system original (bordas finas border-input, fundos bg-background e cantos arredondados rounded-md).Tipografia e Cores: Mapeie as cores semânticas do Tailwind (ex: text-muted-foreground para o cinza correto, text-foreground para o texto principal). Mantenha a hierarquia de fontes (text-sm para labels, text-lg font-semibold para títulos).Layout e Grid: Respeite rigorosamente as classes de layout como grid grid-cols-1 md:grid-cols-2, gap-4 e space-y-6. Calcule as posições X/Y no canvas do Pencil para refletir esses espaçamentos exatos.Estados Visuais: Renderize os inputs no estado padrão, mas inclua as margens corretas de foco/placeholder simuladas visualmente.Execute as ferramentas do MCP passo a passo para gerar o layout e valide a estrutura final de camadas antes de concluir

regra obrigatória: qualquer dúvida/tomada de decisão você precisa me perguntar

## Regra bloqueante — perguntas

**Qualquer dúvida ou tomada de decisão → perguntar ao usuário e esperar resposta.** Não assumir.

Perguntas típicas **antes** de desenhar:

1. Arquivo `.pen` destino (novo dedicado vs canvas ativo)
2. Substituir conteúdo existente vs frame(s) novo(s)
3. Escopo de abas/estados (só aba ativa / um frame por aba / todos)
4. Filhos embutidos (`*Index`, tables): completo vs placeholder
5. Estado visual: vazio (create) vs preenchido (edit) + dados de exemplo
6. Breakpoint (ex.: desktop `md` / `max-w-6xl`)

Se o MCP não estiver no `.pen` certo: pedir para abrir o arquivo e confirmar com `get_editor_state`.

## Fontes (economia de tokens)

| Ler | Quando |
|-----|--------|
| Este `SKILL.md` | Sempre ao invocar |
| O `.tsx` alvo (+ filhos só se escopo pedir) | Sempre |
| [01-tokens-kit.md](../../docs/ui/01-tokens-kit.md) | Tokens / TabTrigger / TabInline |
| [07-ui-components-map.md](../../docs/ui/07-ui-components-map.md) §13.16 | Só se mapear `tabs.tsx` |
| [checklist.md](checklist.md) | Gate final |

**Proibido:** monólito UI; vários shards “por precaução”; `Read`/`Grep` em `.pen` (só MCP Pencil).

Galeria de referência: `OriusMaker/pencil/padrao-ui-ux-orius-pencil.pen` (frame `01` para tabs). Componentes **não** referenciam outro `.pen` — copiar/recriar no arquivo destino.

## Tokens Orius (atalho)

| Token | Valor light | Tailwind |
|-------|-------------|----------|
| `$--primary` | `#FF781F` | `primary` |
| `$--foreground` | `#272F32` | `text-foreground` |
| `$--muted-foreground` | `#737373` | `text-muted-foreground` |
| `$--background` | `#FCFCFC` | `bg-background` |
| `$--muted` | `#F5F5F5` | `bg-muted` |
| `$--border` / `$--input` | `#E5E5E5` | `border` / `border-input` |
| `$--card` | `#FFFFFF` | `bg-card` |

Dialog: `radius-xl` 14, sombra `blur 30`, overlay `#00000033`. Input/Button: `rounded-md` (8); altura seguir o **componente real** do repo (`h-9` ≈ 36 se for o caso) **ou** perguntar se divergir do kit (40).

## Mapeamento Shadcn → Pencil

| React | Pencil |
|-------|--------|
| `Input` / Select visual | frame h≈36–40, stroke `$--input`, `cornerRadius` 8, padding H 12; placeholder `$--muted-foreground` |
| `FormLabel` | text 14/500 `$--foreground` |
| `Button` default | fill `$--primary`, texto `$--primary-foreground` |
| `Button` outline | fill `$--background`, stroke `$--border` |
| `TabsList` pill | `shadcn/TabTriggerActive\|Inactive` + list `bg-muted` |
| Tabs underline | `shadcn/TabInlineActive\|Inactive` + list `border-b` + underline `$--primary` |
| `DialogContent` | card `$--background`, width do `max-w-*`, padding 24 |
| Grid `grid-cols-12 gap-4` | linhas horizontais; spans → larguras fixas ou `fill_container`; `gap` 16 |

Preferir componentes reutilizáveis no próprio `.pen` (`reusable: true`) e instanciar com `ref` + `descendants`.

## Fluxo MCP (passo a passo)

1. `get_editor_state(include_schema: true)` — confirmar `.pen` ativo e schema.
2. Ler o `.tsx` (e filhos autorizados).
3. Ler `01-tokens-kit` se precisar de tokens/tabs.
4. **Perguntar** decisões (bloco acima) → esperar.
5. Garantir canvas correto; se novo arquivo: criar/abrir e revalidar `get_editor_state`.
6. Kit local (FormField, SelectField, Buttons, Tabs) se ainda não existir no arquivo.
7. `batch_design`: um bloco lógico por vez (shell → header/tabs → conteúdo → footer). `placeholder: true` enquanto monta; `FindEmptySpace` para root frames.
8. Multi-aba: **um frame por aba** se o usuário pediu (ex. opção B); nomear claramente.
9. Validar: `batch_get` (camadas), `snapshot_layout` (gap/colunas), `get_screenshot` (fidelidade).
10. Gate: [checklist.md](checklist.md). Resumir frames/IDs e pendências.

### Restrições Pencil

- Só editar o documento **ativo** no MCP.
- Sem `layout` em não-frames; sem `%` width; sem `alignItems: baseline|stretch`.
- Flex single-axis: grids = várias rows manuais.
- `strokeAlignment`: `inner` | `center` | `outer` (não `inside`).
- Após `Copy`/`Replace`, re-ler IDs; não `Update` filhos de `Copy` com IDs antigos.

### Iteração v2

Se o usuário pedir variante (ex. trocar tabs para TabInline): **duplicar** frames (cópia idêntica), renomear (`v2 …`), alterar só o pedido — não sobrescrever v1 sem confirmação.

## Exemplo de invocação

```
Use pencil-tsx-recreate em TPessoaFisicaForm.tsx
```

Seguir o prompt canônico + perguntas obrigatórias + fluxo MCP acima.
