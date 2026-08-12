# Mapa de componentes `shared/ui`

Ler **só** quando houver dúvida de qual primitivo usar.  
Path alvo: `frontend/src/shared/ui/` (Radix + Tailwind; ver `docs/09`).

Enquanto o DS não existir no código, trate esta lista como **contrato alvo** alinhado ao kit provisório ([01](01-tokens-kit.md)).

## 1. Princípios

- Foco visível (`focus-visible`)
- Erro com `aria-invalid` + borda destructive
- Componentes de `shared/ui` são **burros** (props; sem domínio)
- Domínio (Customer, Agenda) fica em `packages/.../components`

## 2. Primitivos previstos no MVP

| Componente | Uso |
|---|---|
| `Button` | primary / outline / destructive / ghost |
| `Input` / `Textarea` | formulários |
| `Select` / `Combobox` | seleção (Combobox para busca de cliente) |
| `DatePicker` / `TimePicker` | agenda |
| `Modal` / `Dialog` / `Drawer` | FormDialog, confirmações |
| `Tabs` | seções de formulário |
| `Table` / DataTable | Index CRUD |
| `Badge` / `StatusPill` | status de agenda / financeiro |
| `Toast` | feedback de mutação |
| `EmptyState` / `Skeleton` | estados |
| `MoneyInput` / `PhoneInput` | máscaras BR |
| `AgendaGrid` / `Timeline` | domínio operacional (podem viver em package ou shared se 2+ usos) |

## 3. Hierarquia de botões

1. **Primary** — uma por viewport/header  
2. **Outline** — secundárias  
3. **Destructive** — só com confirmação  
4. **Ghost / icon** — ações de linha

## 4. Divergência Pencil × código

Pencil (galeria provisória) pode mostrar controles ~40px; implementação real prevalece no componente. Documente “faixa 36–40px” na UI; no código, siga o DS versionado.

## 5. O que não vai em `shared/ui`

- `CustomerForm`, `AppointmentCard`, regras de status de atendimento
- Chamadas API / hooks de domínio
