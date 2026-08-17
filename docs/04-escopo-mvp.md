# 04 — Escopo do MVP

## 1. Objetivo do MVP

> Permitir que uma barbearia real **substitua o caderno + WhatsApp manual** no ciclo: publicar link → cliente agenda → lembrete → barbeiro opera o dia → dono fecha o mês com relatório e comissão — e pague assinatura SaaS.

Critério de "MVP pronto": **3 barbearias piloto** usam o sistema por **2 semanas** em produção sem incidente de dados; o dono opera o dia a dia sem caderno paralelo.

Numeração de épicos alinhada a [requisitos/](./requisitos/README.md).

## 2. Dentro do escopo

### E1 — Identidade e acesso

- Signup self-service (tenant + location padrão + `OWNER`).
- Login e-mail/senha, refresh, recuperação e verificação de e-mail.
- Convite com escopo de unidade; RBAC (`OWNER`, `MANAGER`, `STAFF`, `RECEPTIONIST`).
- Slug público único; redirect do antigo 30 dias.

### E2 — Rede, unidades e cadastros

- CRUD de unidades (timezone, slug, booking flags); seletor oculto com 1 unidade.
- `user_locations`; catálogo de serviços da rede + override por unidade (`location_services`).
- Profissionais (`staff`, `staff_locations`, comissão %, jornada por unidade).
- Horários e bloqueios (RRULE); wizard de onboarding ≤ 4 passos.

> Loja única não vê UI de rede — critério de aceite mais importante de E2.

### E3 — Clientes

- Base única na rede; chave `(tenant_id, phone E.164)`.
- Criação automática na primeira reserva; histórico com unidade de cada atendimento.
- `marketing_opt_in` separado; sem CPF no MVP.

### E4 — Agenda e página pública

- Visão dia/semana; CRUD manual; estados: `SCHEDULED` → `CONFIRMED` → `IN_SERVICE` → `COMPLETED`, mais `CANCELLED` e `NO_SHOW`.
- Overbooking impedido no banco (`EXCLUDE` por `staff_id`, cross-unidade).
- Página `/{tenant}` e `/{tenant}/{location}`; fluxo ≤ 4 telas; **sem OTP**; token de cancelamento.
- Confirmação/lembretes enfileirados ao criar/mover/cancelar (jobs E6).

### E5 — Financeiro da barbearia

- Pagamento ao `COMPLETED` (centavos; `CASH`, `PIX`, `DEBIT`, `CREDIT`, `OTHER`).
- Comissão derivada de `%` do staff × recebido no período.
- Sem caixa do dia, contas a pagar ou NFS-e no MVP.

### E6 — WhatsApp e notificações

- Confirmação + lembretes **24 h** e **2 h** antes.
- **WAHA GOWS** default + **Resend** fallback ([ADR-0016](./adr/0016-waha-default-messaging.md)).
- Checkbox de ciência antes do QR; kill switch.

### E7 — Relatórios

- Faturamento, atendimentos, ticket, no-show, top serviços, comissão — por unidade e consolidado (`OWNER`).
- Export CSV; somente leitura (views).

### E8 — Billing SaaS

- Trial 14 dias; **cobrança manual** ([ADR-0010](./adr/0010-billing-saas-manual-mvp.md)); sem checkout.
- Limites por profissionais e unidades; `grace_until`; fila no back-office.

### E9 — Plataforma e LGPD

- RLS + testes de isolamento tenant **e** unidade no CI.
- Back-office: tenants, MRR, impersonation (leitura), exportação, `audit_log`.

## 3. Fora do MVP

| Item | Fase | Motivo |
| --- | --- | --- |
| App nativo | 2+ | Web responsivo basta |
| Sinal / pagamento antecipado | 2 | Arma anti-no-show; fora do corte |
| Estoque, comanda rica, DRE | 2+ | Escopo salão, não barbearia enxuta |
| Fidelidade / cupons | 2 | Depois de aquisição |
| Marketplace | — | Anti-objetivo |
| Google Calendar | 2 | Nice-to-have |
| Domínio próprio por tenant | 2 | |
| Inbox WhatsApp | 2 | Sessão WAHA já preparada |
| Checkout Stripe/MP/Asaas | 2 | ADR-0010 |

## 4. User stories (aceite)

### US-01 — Publicar página

- Wizard completo → `/{tenant}` 200 (1 unidade, sem seletor).
- Slug duplicado rejeitado com sugestão.
- Sem serviço ativo → "agendamento indisponível", não 500.

### US-02 — Agendar como cliente

- Slots respeitam unidade, jornada, bloqueios e compromissos do staff em **outras** unidades.
- Passado e > 60 dias bloqueados; telefone E.164; `409 SLOT_TAKEN` em concorrência.
- Confirmação no canal ativo após reserva.

### US-03 — Agenda do dia (barbeiro)

- Login → agenda de hoje; `STAFF` só vê os próprios.
- Status reflete em ≤ 2 s (polling 30 s aceitável).

### US-04 — Bloquear horário

- Recorrente semanal; conflitos listados antes de confirmar bloqueio.

### US-05 — Relatório do mês

- Filtro período/profissional/unidade; só `COMPLETED`; CSV.

### US-06 — Assinar

- Trial 14 d sem cartão; ativação **manual** pós-trial.
- `PAST_DUE` + contato; nada desliga antes de `grace_until`.
- `SUSPENDED`: página off; painel só instruções + exportação.

### US-07 — Operar rede

- Troca de unidade sem novo login; `MANAGER` de X não vê Y (404).
- Consolidado = soma das unidades; staff não double-booked cross-unidade.

### US-08 — Isolamento

- Tenant A → 404 em recurso de B; escopo unidade X → 404 em Y.
- CI falha se tabela operacional sem RLS.

## 5. Definition of Done

- E1–E9 entregues com testes de integração ([12 — Qualidade](./12-qualidade-testes.md)).
- Suíte de isolamento verde.
- 3 pilotos, 2 semanas, zero incidente S1 de dados.
- p95 grade de horários < 500 ms; demais APIs < 300 ms.

## Referências

- [03 — Personas e Jornadas](./03-personas-jornadas.md)
- [requisitos/](./requisitos/)
- [13 — Roadmap](./13-roadmap-estimativas.md) (S0–S8)
