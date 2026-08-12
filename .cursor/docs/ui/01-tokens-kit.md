# Tokens e kit visual

**Status:** tokens **provisórios** (base Orius). O design system definitivo do SaaS barbearias será definido depois — até lá, use estes valores para consistência.

Não ler monólito; detalhe de telas nos outros shards.

## 1. Cores semânticas (light)

| Token | Valor | Uso |
|---|---|---|
| `background` | `#FCFCFC` | Fundo da página |
| `foreground` | `#272F32` | Texto principal |
| `card` | `#FFFFFF` | Card / dialog |
| `primary` | `#FF781F` | CTA principal (provisório) |
| `primary-foreground` | `#FFFFFF` | Texto em primary |
| `secondary` | `#272F32` | Secundário sólido |
| `muted` | `#F5F5F5` | Header de tabela, skeleton |
| `muted-foreground` | `#737373` | Descrições, placeholders |
| `border` / `input` | `#E5E5E5` | Bordas |
| `destructive` | `#E7000B` | Exclusão / erro crítico |

### Status da agenda (produto)

Cores de status de agendamento são **semânticas de domínio** (não confundir com `primary`):

| Status | Uso na UI |
|---|---|
| Solicitado | cinza tracejado |
| Agendado | azul |
| Confirmado | verde |
| Atendendo | roxo |
| Atendido | verde escuro |
| Faltou | vermelho |
| Cancelado | riscado / ocultável |

(Ver `docs/09` — agenda.) Nunca comunicar status **só** por cor (ícone + texto).

## 2. Tipografia

- Família provisória: **Inter** (DS definitivo pode trocar)
- Page title ~36–38 / 600–700
- Dialog title ~19–20 / 600
- Label ~13 / 500–600
- Body / descrição ~14–15 / 400
- Meta ~11–12 / muted

## 3. Radius e sombra

| Token | px | Uso |
|---|---|---|
| `radius-md` | 8 | Button, Input |
| `radius-lg` | 10 | Blocos internos |
| `radius-xl` | 14 | Card de página, Dialog |

## 4. Kit base (shadcn em `frontend/src/shared/ui`)

| Componente | Spec alvo |
|---|---|
| Button primary | h ~40 (ou contrato real do DS), `primary` |
| Button outline | borda `border`, texto `foreground` |
| Input | h ~40, placeholder `muted-foreground` |
| Card | `radius-xl`, padding ~24 |

Hierarquia de ações: **1** CTA primary no header; secundárias `outline`; destrutivas `destructive`.

## 5. Onde vive o DS no código

- Componentes: `frontend/src/shared/ui/`
- Layout shell: `frontend/src/shared/layout/`
- Não colocar UI de domínio em `shared/` — vai em `packages/<area>/components/<Entidade>/`
