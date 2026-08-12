# CRUD: Index, Table, Columns

Norma: `docs/16` · `docs/09` · rules `frontend-component-index|table|columns`.

Exemplo canônico: **Customer** em `frontend/src/packages/operacional/`.

## 1. Página de listagem

```
[ Título + descrição + CTA "Novo cliente" ]
[ Card ]
  [ Busca / filtros ]
  [ Tabela ]
  [ Paginação / load more ]
```

## 2. Estados

| Estado | Comportamento |
|---|---|
| **Dados** | Linhas densas; coluna principal em weight 600 |
| **Carregando** | Skeleton nas linhas; header/filtros estáveis |
| **Vazio** | Empty state + CTA para criar |
| **Erro** | Mensagem + tentar novamente (`requestId` em detalhes) |
| **FormDialog** | Criar/editar em modal (montado só se aberto) |
| **ConfirmDialog** | Exclusão / inativação |
| **Row actions** | Menu `⋯` → Editar / Remover (labels curtas) |

## 3. Padrão `Index`

Arquivo: `components/Customer/CustomerIndex.tsx`

1. `Header` (title, description, CTA)
2. `CustomerTable` com dados do hook
3. `ConfirmDialog` / `CustomerFormDialog` **condicionais**
4. Hooks:
   - `useCustomerListHook` → `useQuery`
   - `useCustomerCreateHook` / `Update` / `Delete` → `useMutation` + `invalidateQueries(['customers'])`

### Regras

- Index **não** chama Data/API/Service
- Index centraliza open/close de modais e callbacks `onEdit` / `onDelete`
- Table nunca é desenhada “na mão” no Index
- **Sem** CollectionHook obrigatório — cache = TanStack Query

```tsx
{isFormOpen && <CustomerFormDialog ... />}
{isConfirmOpen && <ConfirmDialog ... />}
```

## 4. Padrão `Table` / `Columns`

- `CustomerTable.tsx` — apresentacional; props tipadas em `types/Customer/CustomerTableTypes.ts`
- `CustomerColumns.tsx` — `ColumnDef`; ações curtas (`Editar`, `Remover`)
- Sem fetch; sem regra de negócio

## 5. Paginação

Preferir cursor da API (`meta.nextCursor`) ou load more alinhado a `docs/08`.  
UI: label de página/estado + botões outline.

## 6. Exemplos de entidades

| Entidade | Package | CTA |
|---|---|---|
| Customer | `operacional` | Novo cliente |
| Procedure | `admin` | Novo procedimento |
| Appointment | `operacional` | Novo agendamento |
| Receivable | `financeiro` | Novo título |
