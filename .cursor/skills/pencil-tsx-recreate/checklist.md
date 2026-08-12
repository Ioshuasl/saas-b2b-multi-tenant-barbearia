# Checklist — pencil-tsx-recreate (gate final)

Usar **somente no fim**, após screenshots/layout.

## Decisões

- [ ] Todas as dúvidas foram perguntadas e respondidas (sem assumir)
- [ ] Canvas MCP = `.pen` destino confirmado via `get_editor_state`

## Fidelidade ao TSX

- [ ] Primitivos Shadcn mapeados (Input, Label, Button, Select, Card/Dialog, Tabs)
- [ ] Tokens Tailwind → `$--*` Orius (`foreground`, `muted-foreground`, `border`/`input`, `primary`, …)
- [ ] Hierarquia tipográfica (labels `text-sm`, títulos dialog `font-semibold`)
- [ ] Grid/gap do TSX respeitados (`gap-4` → 16, spans → larguras/`fill_container`)
- [ ] Estado pedido (create vazio / edit com dados) aplicado
- [ ] Filhos Index/Table no escopo acordado (completo vs placeholder)

## Pencil

- [ ] Sem Read/Grep em `.pen`
- [ ] Componentes reutilizáveis nomeados (`shadcn/…`) quando repetidos
- [ ] Tabs: `TabTrigger*` (pill) ou `TabInline*` (underline) conforme decisão
- [ ] `placeholder` removido nos frames concluídos
- [ ] Frames nomeados e posicionados (`FindEmptySpace`, sem overlap)

## Validação

- [ ] `batch_get` — árvore de camadas coerente
- [ ] `snapshot_layout` — sem colapso / colunas iguais se aplicável
- [ ] `get_screenshot` — revisão visual do(s) frame(s)
- [ ] Resumo ao usuário: arquivos `.pen`, frames, validações, bloqueios/perguntas abertas
