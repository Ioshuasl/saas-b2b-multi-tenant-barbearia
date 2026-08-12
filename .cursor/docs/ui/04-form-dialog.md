# Form, FormDialog e grid

Norma: `docs/16` · rules `frontend-component-form` / `form-dialog`.  
Tipagens em `types/<Entidade>/` — **sem** pasta `interfaces/`.

## 1. Nomenclatura

| Arquivo | Uso |
|---|---|
| `CustomerForm.tsx` | Formulário de **página** |
| `CustomerFormDialog.tsx` | Formulário em **modal** |

Não misturar.

## 2. Grid de campos

| Layout | Quando |
|---|---|
| 1 coluna full | Nome, observação, textarea |
| 2 colunas | Pares (telefone / e-mail; nome / observações) |
| Lookup + botão | Busca cliente / profissional |
| Campos de serviço | duração/preço quando aplicável |

Ordem típica Customer: nome → telefone → e-mail/observações → ação.

## 3. FormHook

- `useCustomerFormHook` centraliza `useForm` + Zod
- Componente: `form.handleSubmit(onSave, onError)`
- Sem `useForm` / `defaultValues` / `resolver` inline no JSX
- Reset no FormDialog via `handleForm` + `useEffect`

## 4. FormDialog

- Props em `types/Customer/CustomerFormDialogTypes.ts`
- Index monta só quando aberto
- Create vs Update: Data decide método HTTP (`POST`/`PATCH`) — não o Form

## 5. Form de página (longo)

Quando o formulário for extenso (ex.: orçamento, configuração de clínica):

- cards empilhados na main
- Sidebar 360 de navegação (ver [05](05-sidebar-details.md))
- progressive disclosure: cadastro principal primeiro, vínculos depois

## 6. Bloqueios de produto (exemplos)

| Contexto | Regra de UI |
|---|---|
| Telefone inválido | Bloquear submit; normalizar E.164 |
| Sem CRO no profissional | Bloquear assinar evolução (mensagem clara) |
| Assinatura suspensa | Somente leitura + exportação liberada |

Mensagens em pt-BR; erros de API via `code` estável (`docs/08`).
