# Anatomia e fluxos

CRUD listagem: [03-crud-index-table.md](03-crud-index-table.md).  
Norma de pastas: `docs/16` · `docs/09`.

## 1. Canvas

- Largura de referência: ~1280 (fluxo) / ~1180 (listagem)
- Padding de conteúdo: ~40px
- Fundo: `background`

## 2. Header de página

Obrigatório:

1. **Título** à esquerda (ex.: `Clientes`, `Agenda`)
2. **Descrição curta** abaixo (muted)
3. **Um CTA primary** à direita (ex.: `Novo cliente`)

Não empilhar stats, filtros ou metadados no header — filtros ficam no card de conteúdo.

Exemplos de copy (pt-BR):

| Tela | Título | Descrição | CTA |
|---|---|---|---|
| Clientes | Clientes | Cadastro e busca da barbearia | Novo cliente |
| Agenda | Agenda | Consultas do dia e da semana | Novo agendamento |
| Orçamentos | Orçamentos | Propostas e aprovação | Novo orçamento |

## 3. Layout por tipo de tela

| Tipo | Layout |
|---|---|
| **CRUD listagem (Index)** | Header + 1 card com busca + DataTable |
| **Form longo** | Main + Sidebar sticky 360 (navegação de seções) |
| **Details / atendimento** | Main (dados) + Sidebar 360 (ações) |
| **FormDialog** | Overlay + painel central |
| **Agenda** | Grade full-bleed no conteúdo (sem “card de tabela” clássico) — ver `docs/09` |

## 4. Fluxos do produto (orientação)

| Fluxo | Package | Padrão de tela típico |
|---|---|---|
| Cadastro cliente | `operacional` | Index + FormDialog |
| Agenda / reencaixe | `operacional` | tela dedicada (grade) |
| Agenda do dia | `operacional` | Index + Details |
| Relatório / comissões | `financeiro` | Index + filtros |
| Financeiro (receber/caixa) | `financeiro` | Index + FormDialog / Details |
| Inbox WhatsApp | `messaging` | layout 3 colunas (`docs/09`) |

## 5. Checklist rápido de página

- [ ] Header com 1 CTA
- [ ] Estados: loading / vazio / erro / sem permissão
- [ ] Textos em pt-BR, sem jargão técnico
- [ ] Status nunca só por cor
- [ ] Page (`app/.../page.tsx`) só compõe — zero fetch
