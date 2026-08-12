# 10 — Roadmap de Entrega

Estimativas em semanas para **1 dev full-stack em tempo integral**. Com 2 devs, aproximadamente 60% do tempo (as fases 2 e 3 paralelizam bem: agenda vs. página pública).

## Fase 0 — Fundação (2 semanas)
- Monorepo (Express+Sequelize / Next.js), docker-compose (postgres, redis, mailhog, evolution-api), CI (eslint/tsc/test).
- Migrations com SQL cru para RLS e `btree_gist`; helper `withTenant` + hook global que falha em query fora de transação com tenant.
- Esqueleto de auth (signup/login/refresh), middleware de tenant **e de escopo de unidade**.
- **Suíte de testes de isolamento (tenant e unidade) desde o início** — não é item de fim de projeto.
- Seed com 2 tenants, um deles com 2 unidades.
- Iniciar em paralelo, porque demoram: verificação do Meta Business Manager e abertura de conta no provedor de pagamento escolhido.

✅ *Pronto quando:* um usuário do tenant A recebe 404 em recurso do tenant B, **e** um gerente da unidade X recebe 404 em recurso da unidade Y — provados por teste no CI.

## Fase 1 — Cadastros, unidades e configuração (2 semanas)
- CRUD de unidades, serviços (catálogo da rede + override por unidade), profissionais, horário de funcionamento, bloqueios.
- Convite de profissional, RBAC e `user_locations`.
- Seletor de unidade no painel (oculto com uma só) e configurações do tenant/slug.

## Fase 2 — Motor de agendamento (3 semanas) — maior risco técnico
- Cálculo de disponibilidade em SQL cru (timezone **por unidade**, jornadas, bloqueios, buffers).
- Criação/edição/cancelamento com constraint de não sobreposição.
- Testes pesados: DST, virada de dia, concorrência, serviços múltiplos, **profissional atuando em duas unidades**.

✅ *Pronto quando:* teste de concorrência com 50 requisições simultâneas no mesmo slot resulta em exatamente 1 sucesso.

## Fase 3 — Agenda no painel (2,5 semanas)
- Visão dia (colunas por profissional da unidade selecionada) e semana.
- Criar/arrastar/remarcar, mudança de status, registro de pagamento.
- Mobile-first para o barbeiro.

## Fase 4 — Página pública (2,5 semanas)
- `/{tenant}` com seletor de unidades (ou redirect) e `/{tenant}/{unidade}` com serviços, profissionais e grade de horários.
- Fluxo de reserva em 4 telas, cancelamento por token.
- Performance e SEO local.

## Fase 5 — Notificações (1,5 semana)
- Worker + fila, templates com variáveis nomeadas, lembretes (24h/2h), cancelamento de pendentes.
- E-mail como fallback obrigatório + adapter **Evolution API** atrás da interface `WhatsAppProvider`, com monitor de sessão.
- Migração para API oficial fica fora do MVP, mas a interface e os templates já nascem compatíveis ([14](14-whatsapp-notificacoes.md)).

## Fase 6 — Clientes e relatórios (2 semanas)
- Lista de clientes com histórico (base única da rede, com a unidade de cada atendimento).
- Relatório de faturamento, no-show, top serviços, comissões, export CSV — por unidade e consolidado.

## Fase 7 — Billing (2 semanas)
- Integração com o provedor escolhido atrás de `PaymentProvider`, checkout, webhooks idempotentes, estados da assinatura, gates por plano (profissionais **e** unidades), reconciliação diária.

## Fase 8 — Back-office e lançamento (1,5 semana)
- Listagem de tenants, MRR, impersonation auditada.
- **Fila de cobrança com negociação de prazo** (`grace_until`, motivo, histórico de contato) — sem ela a política de inadimplência de [08](08-billing-planos.md) não funciona.
- Onboarding wizard polido, e-mails transacionais, termos/privacidade/DPA.
- Observabilidade, alertas, runbooks, teste de restore.

**Total: ~19 semanas (≈4,5 meses) com 1 dev; ~12 semanas com 2 devs.**

O acréscimo de ~4,5 semanas sobre a estimativa anterior é o custo de multi-unidade no MVP. Vale pagar agora: retrofitar `location_id` em agenda, relatórios e página pública depois custaria bem mais.

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
Cortar, nesta ordem: relatório consolidado da rede (deixar só por unidade) → preço sobrescrito por unidade → relatórios avançados → back-office (substituir por queries manuais) → WhatsApp (fica só e-mail) → comissões. **Nunca cortar:** `location_id` no modelo de dados, isolamento multi-tenant, prevenção de overbooking, página pública.

Observação: mesmo cortando funcionalidades de rede, **as colunas `location_id` entram no schema desde a Fase 0**. Cortar UI é barato; cortar modelo de dados é uma migração dolorosa depois.
