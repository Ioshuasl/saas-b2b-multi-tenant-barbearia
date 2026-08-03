# 11 — Métricas e Critérios de Sucesso

## North star

**Agendamentos confirmados por tenant ativo por semana.**

Mede valor real entregue (a barbearia está usando para o que importa), correlaciona com retenção e com disposição a pagar. Meta pós-MVP: ≥ 40/semana por tenant.

## Funil de aquisição e ativação

| Etapa | Evento | Meta |
|---|---|---|
| Visita ao site | `landing_view` | — |
| Conta criada | `tenant_created` | 5% da visita |
| Wizard concluído | `onboarding_completed` | ≥ 60% das contas |
| Primeiro agendamento (qualquer origem) | `first_appointment_created` | ≥ 70% dos ativados |
| **Primeiro agendamento pela página pública** | `first_public_booking` | ≥ 50% — é o momento "aha" |
| Trial → pago | `subscription_activated` | ≥ 25% |

**Definição de tenant ativo:** ≥ 5 agendamentos criados nos últimos 7 dias.

## Métricas de produto

- Agendamentos/semana por tenant (e % vindos da página pública vs. manual).
- Taxa de no-show antes e depois dos lembretes — é o argumento de venda mais forte; medir com rigor.
- Tempo médio do onboarding (signup → publicar página). Meta: < 10 min, p90 < 20 min.
- Barbeiros ativos por tenant (adoção interna).
- Taxa de cancelamento via link público (indica que o fluxo funciona sem WhatsApp).
- Tempo de resposta p95 da grade de horários (< 500ms).

## Métricas de negócio (SaaS)

- MRR, ARPA, crescimento de MRR.
- Churn de logo e de receita (meta MVP: < 10%/mês de logo; abaixo de 5% é bom para SMB).
- Conversão trial → pago.
- CAC por canal e razão LTV/CAC (alvo > 3).
- % de tenants em `PAST_DUE`.
- NPS trimestral do dono.

## Qualidade e confiabilidade

- Uptime ≥ 99,5% no MVP.
- Erro 5xx < 0,5% das requisições.
- Zero incidentes de vazamento entre tenants (métrica binária; qualquer ocorrência é P0).
- Taxa de entrega de lembretes ≥ 95%.
- Overbookings em produção: zero.

## Instrumentação

Todo evento carrega `tenant_id`, `user_id` (quando houver), `role`, `plan` e `source`. Eventos mínimos do dia 1:
`tenant_created`, `onboarding_step_completed`, `onboarding_completed`, `service_created`, `staff_invited`, `appointment_created` (com `source`), `appointment_status_changed`, `public_page_viewed`, `availability_viewed`, `booking_abandoned` (com o passo), `notification_sent/failed`, `subscription_*`.

`booking_abandoned` por passo é o que revela onde o cliente final desiste — é a métrica que mais melhora conversão da página pública.

## Revisão
Semanal: funil de ativação e agendamentos por tenant. Mensal: MRR, churn, no-show agregado, NPS.
