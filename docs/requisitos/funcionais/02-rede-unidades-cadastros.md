# RF — Rede, Unidades e Cadastros (E2)

**Módulo:** `locations` · **Detalhe:** [modulos/02-rede-unidades-cadastros.md](../../modulos/02-rede-unidades-cadastros.md) · Escopo: E1b + E2

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E2-01 | `OWNER` cadastra/edita dados da rede (tenant): nome, logo, cor de marca, slug público único global | Must | US-01, J1 |
| RF-E2-02 | Sistema cria Location padrão no signup (`is_default`); com uma única unidade ativa, o seletor de unidade **não aparece** na UI | Must | E1b, critério crítico |
| RF-E2-03 | `OWNER` faz CRUD de unidades: nome, endereço, telefone, timezone IANA, slug próprio, foto, flags de booking | Must | E1b, US-07 |
| RF-E2-04 | Slug de tenant e de unidade são únicos nos seus escopos; slug antigo redireciona por 30 dias (`tenant_slug_history`) | Must | E1 |
| RF-E2-05 | Trocar de unidade no painel (`X-Location-Id`) não exige novo login; valor sempre validado contra `user_locations` | Must | US-07, doc 06 |
| RF-E2-06 | `OWNER`/`MANAGER` define horário de funcionamento por unidade e dia da semana, com intervalos (ex.: 9–12 e 13–19) | Must | E2, J1 |
| RF-E2-07 | `OWNER`/`MANAGER` cadastra bloqueios (folga, férias, almoço, feriado) pontuais ou recorrentes (RRULE), por unidade e/ou profissional | Must | US-04 |
| RF-E2-08 | Bloqueio sobre agendamentos existentes exige confirmação e lista os afetados (não cancela automaticamente) | Must | US-04 |
| RF-E2-09 | `OWNER`/`MANAGER` mantém catálogo de **serviços da rede**: nome, duração (min), buffer, preço em centavos, cor, ativo, visível online | Must | E2, J1 |
| RF-E2-10 | Unidade pode ativar/desativar serviço e sobrescrever preço/duração via `location_services`; sem linha herda o catálogo do tenant | Must | E1b |
| RF-E2-11 | No signup, sistema importa serviços padrão sugeridos (Corte, Barba, Corte+Barba) editáveis | Must | J1 |
| RF-E2-12 | Alteração de preço/duração no catálogo não altera agendamentos já criados (snapshot em `appointment_services`) | Must | doc 05/07 |
| RF-E2-13 | `OWNER`/`MANAGER` cadastra profissionais (`staff`): nome, foto, comissão %, unidade(s), jornada por unidade, aceita booking online | Must | E2, J1 |
| RF-E2-14 | Profissional pode atender em mais de uma unidade (`staff_locations`); constraint de não sobreposição é por `staff_id` (sem `location_id`) | Must | US-07, doc 06 |
| RF-E2-15 | Vínculo `staff_services` define quais serviços o profissional executa; vazio = todos os ativos | Must | E2 |
| RF-E2-16 | Serviço/profissional com histórico só podem ser inativados (não excluídos fisicamente); exclusão física só via LGPD | Must | doc 07 |
| RF-E2-17 | Wizard de onboarding (≤ 4 passos): horário → serviços → profissionais → publicar; meta ≤ 10 minutos | Must | J1, RNF-UX |
| RF-E2-18 | Ao publicar, sistema exibe link público e QR Code da unidade | Must | J1, US-01 |
| RF-E2-19 | Timezone é **por unidade** (rede pode cruzar fusos); banco persiste `timestamptz` UTC | Must | doc 05/06 |
| RF-E2-20 | Antecedência mínima, horizonte de booking e prazo de cancelamento são configuráveis por unidade (defaults 60 min / 60 dias / 2 h) | Must | doc 07 |

## Critérios de aceite transversais (E2)

- Barbearia de uma unidade não vê complexidade de rede (seletor oculto).
- Duas unidades `is_default` simultâneas são impossíveis.
- Slug duplicado de tenant é rejeitado com sugestão alternativa.
- Multi-unidade **não** pode encarecer o onboarding da loja única (medir tempo separado — doc 14).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E2-21 | Domínio próprio por tenant (`agenda.suabarbearia.com.br`) | Could (fase 2) |
| RF-E2-22 | Whitelabel completo | Won't (fase 3) |
| RF-E2-23 | Estoque / transferência entre unidades | Won't (MVP) |
