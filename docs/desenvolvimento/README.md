# Desenvolvimento — diário e progresso

Pasta **somente** para acompanhamento do desenvolvimento (scaffold, sprints, decisões pontuais de implementação). Não substitui a especificação em `docs/` (01–17, ADRs, requisitos, módulos).

## Como usar

| Arquivo / pasta | Uso |
| --- | --- |
| [PROGRESSO.md](./PROGRESSO.md) | Log cronológico do que foi feito (append-only) |
| [sprints/](./sprints/) | Notas por sprint (checklist, bloqueios, entregáveis) |
| Este README | Índice e convenções |

## Convenções

1. Atualizar `PROGRESSO.md` ao fechar um bloco de trabalho (scaffold, feature, correção relevante).
2. Não duplicar RF/ADR aqui — linkar para `docs/…`.
3. Bloqueios e perguntas abertas ficam no log da sprint até resolvidos.
4. **Toda sprint** deve detalhar **Backend** e **Frontend** em seções separadas (o que entra, o que não entra, e em qual bloco). Se um lado não tiver entrega, escrever explicitamente “nenhuma tela / nenhum endpoint nesta sprint”.

## Status atual

- **Fase:** Sprint 0 — Fundação técnica + segurança (E9 parcial) — **código entregue** (aceite local)
- **Próximo:** Sprint 1 — Identidade, rede e cadastros
- **Especificação:** [`../README.md`](../README.md)
- **Checklist S0:** [`sprints/S0-fundacao.md`](./sprints/S0-fundacao.md)
