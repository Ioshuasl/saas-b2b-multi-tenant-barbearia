# RF — Agenda e Página Pública (E4)

**Módulo:** `scheduling` · **Detalhe:** [modulos/04-agenda.md](../../modulos/04-agenda.md) · Escopo: E3 + E4 do produto

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E4-01 | Usuário autorizado visualiza agenda **dia** (colunas por profissional da unidade) e **semana** | Must | E3, J3/J4 |
| RF-E4-02 | Status do agendamento: `SCHEDULED` → `CONFIRMED` → `IN_SERVICE` → `COMPLETED`, mais `CANCELLED` e `NO_SHOW` | Must | E3, doc 05 |
| RF-E4-03 | Transições seguem máquina de estados; transição inválida → erro de domínio / `409` | Must | doc 05 |
| RF-E4-04 | `OWNER`/`MANAGER`/`RECEPTIONIST` criam/editam/cancelam agendamento manual (cliente que ligou / walk-in) | Must | J4 |
| RF-E4-05 | `STAFF` altera status apenas dos próprios atendimentos; login cai na agenda do dia | Must | US-03, J3 |
| RF-E4-06 | Sistema impede overbooking do mesmo profissional no mesmo intervalo (constraint `EXCLUDE` no Postgres, sem `location_id`) | Must | US-02, US-07, ADR-0002/doc 06 |
| RF-E4-07 | Conflito de slot retorna `409 SLOT_TAKEN` e a grade recarrega | Must | US-02 |
| RF-E4-08 | Duração e preço são calculados/snapshotados no servidor a partir dos serviços; cliente não informa `ends_at` | Must | doc 07 |
| RF-E4-09 | Slots disponíveis respeitam: horário da unidade ∩ jornada do profissional na unidade − bloqueios − agendamentos do profissional em **todas** as unidades | Must | US-02, doc 05 |
| RF-E4-10 | Não é possível agendar no passado nem além do horizonte da unidade (default 60 dias); antecedência mínima configurável | Must | US-02 |
| RF-E4-11 | Página pública `/{tenantSlug}`: com 1 unidade ativa redireciona; com várias mostra seletor (nome, endereço, distância) | Must | E4, US-07 |
| RF-E4-12 | Página pública `/{tenantSlug}/{locationSlug}`: serviços, profissionais, grade e fluxo sem login (nome + telefone) | Must | US-01, US-02, J2 |
| RF-E4-13 | Fluxo público em ≤ 4 telas; mobile-first (maioria do tráfego celular) | Must | J2, RNF-UX |
| RF-E4-14 | Sem serviço ativo visível, a página exibe “agendamento indisponível” (não erro 500) | Must | US-01 |
| RF-E4-15 | Link de cancelamento/remarcação por `cancel_token` (UUID), válido até o prazo configurado; comparação em tempo constante | Must | E4, doc 10 |
| RF-E4-16 | Cancelamento público após o prazo → `422 TOO_LATE_TO_CANCEL` | Must | doc 08 |
| RF-E4-17 | Rate limit por IP e por unidade na API pública; honeypot + captcha progressivo após N tentativas | Must | doc 08/10 |
| RF-E4-18 | Limite de agendamentos futuros por telefone (default 3) na rota pública | Must | doc 08 |
| RF-E4-19 | Ao criar/mover/cancelar, sistema agenda ou cancela jobs de confirmação e lembretes (24h e 2h antes) | Must | E5, J2 |
| RF-E4-20 | Origem do agendamento registrada: `PUBLIC_PAGE`, `PANEL`, `PHONE`, `WALKIN` | Must | doc 07 |
| RF-E4-21 | Mudança de status reflete para outros usuários do tenant em ≤ 2 s (polling ≤ 30 s aceitável no MVP) | Should | US-03 |
| RF-E4-22 | Drag-and-drop / remarcação visual no painel | Should | Fase painel |

## Critérios de aceite transversais (E4)

- 50 requisições concorrentes no mesmo slot → exatamente 1 sucesso (Fase 2 do roadmap).
- p95 da grade de horários &lt; 500 ms (DoD do MVP).
- `GET` público de agendamento por token retorna dados mascarados (sem PII excessiva).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E4-23 | Fila de espera / reencaixe automático | Could (fase 2) |
| RF-E4-24 | Integração Google Calendar | Could (fase 2) |
| RF-E4-25 | Pagamento antecipado / sinal pelo cliente | Won't (MVP) — confirmado |
| RF-E4-26 | OTP obrigatório no autoagendamento | Won't (MVP) — fricção zero |
