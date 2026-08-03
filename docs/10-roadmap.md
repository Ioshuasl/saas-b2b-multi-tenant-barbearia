# 10 — Roadmap de Entrega

Estimativas em semanas para **1 dev full-stack em tempo integral**. Com 2 devs, aproximadamente 60% do tempo (as fases 2 e 3 paralelizam bem: agenda vs. página pública).

## Fase 0 — Fundação (1,5 semana)
- Monorepo, docker-compose, CI (lint/typecheck/test).
- Postgres com migrações, convenção `tenant_id` + RLS, helper de transação com `SET LOCAL`.
- Esqueleto de auth (signup/login/refresh), middleware de tenant.
- **Suíte de testes de isolamento multi-tenant desde o início** — não é item de fim de projeto.
- Seed com 2 tenants.

✅ *Pronto quando:* um usuário do tenant A recebe 404 em recurso do tenant B, provado por teste no CI.

## Fase 1 — Cadastros e configuração (1,5 semana)
- CRUD de serviços, profissionais, horário de funcionamento, bloqueios.
- Convite de profissional, RBAC.
- Configurações do tenant e slug.

## Fase 2 — Motor de agendamento (2,5 semanas) — maior risco técnico
- Cálculo de disponibilidade (timezone, jornadas, bloqueios, buffers).
- Criação/edição/cancelamento com constraint de não sobreposição.
- Testes pesados: DST, virada de dia, concorrência, serviços múltiplos.

✅ *Pronto quando:* teste de concorrência com 50 requisições simultâneas no mesmo slot resulta em exatamente 1 sucesso.

## Fase 3 — Agenda no painel (2 semanas)
- Visão dia (colunas por profissional) e semana.
- Criar/arrastar/remarcar, mudança de status, registro de pagamento.
- Mobile-first para o barbeiro.

## Fase 4 — Página pública (2 semanas)
- `/{slug}` com serviços, profissionais, grade de horários.
- Fluxo de reserva em 4 telas, cancelamento por token.
- Performance e SEO local.

## Fase 5 — Notificações (1 semana)
- Worker + fila, templates, agendamento de lembretes (24h/2h), cancelamento de pendentes.
- E-mail no MVP; WhatsApp atrás de flag (depende de homologação — iniciar o processo na Fase 0).

## Fase 6 — Clientes e relatórios (1,5 semana)
- Lista de clientes com histórico.
- Relatório de faturamento, no-show, top serviços, comissões, export CSV.

## Fase 7 — Billing (1,5 semana)
- Integração com provedor, checkout, webhooks idempotentes, estados da assinatura, gates por plano, reconciliação diária.

## Fase 8 — Back-office e lançamento (1 semana)
- Listagem de tenants, MRR, impersonation auditada.
- Onboarding wizard polido, e-mails transacionais, termos/privacidade/DPA.
- Observabilidade, alertas, runbooks, teste de restore.

**Total: ~14,5 semanas (≈3,5 meses) com 1 dev; ~9 semanas com 2 devs.**

## Marcos

| Marco | Quando | Critério |
|---|---|---|
| M1 — Esqueleto seguro | fim da Fase 0 | isolamento provado por teste |
| M2 — Agenda usável internamente | fim da Fase 3 | dono consegue operar o dia inteiro pelo painel |
| M3 — Piloto fechado | fim da Fase 5 | 3 barbearias reais usando de graça |
| M4 — MVP comercial | fim da Fase 8 | primeira barbearia pagante |
| M5 — Validação | +90 dias de M4 | 10 tenants pagantes, churn < 10%/mês |

## Estratégia de piloto (crítica)
Recrutar 3 barbearias **antes** da Fase 3 e mostrar a agenda a cada duas semanas. Rodar o piloto de graça em troca de feedback e de permissão para observar o uso presencialmente por meio dia. A maior parte dos erros de escopo aparece assistindo o barbeiro usar, não em reunião.

## Ordem de prioridade se o prazo apertar
Cortar, nesta ordem: relatórios avançados → back-office (substituir por queries manuais) → WhatsApp (fica só e-mail) → comissões. **Nunca cortar:** isolamento multi-tenant, prevenção de overbooking, página pública.
