# 03 — Escopo do MVP

Critério de corte: **entra no MVP apenas o que é necessário para uma barbearia real substituir o caderno + WhatsApp e pagar por isso.**

## Dentro do MVP

### E1 — Contas, tenants e unidades
- Cadastro self-service de barbearia (cria tenant + primeira unidade + OWNER).
- Login por e-mail/senha, recuperação de senha, verificação de e-mail.
- Convite de profissional por link/e-mail, com escopo de unidade.
- Slug público único e editável (com redirect do antigo por 30 dias).

### E1b — Multi-unidade (rede)
- CRUD de unidades: nome, endereço, telefone, timezone, slug próprio, foto.
- **Seletor de unidade no painel** (some quando há só uma) e escopo de acesso por usuário (`user_locations`).
- Página pública por unidade (`/{tenant}/{unidade}`) e página raiz com seletor.
- Profissional vinculado a uma ou mais unidades, com jornada por unidade.
- Catálogo de serviços da rede com ativação e preço sobrescrito por unidade.
- Relatórios com filtro por unidade e visão consolidada da rede.
- Base de clientes única na rede, com histórico mostrando em qual unidade cada atendimento ocorreu.

> Barbearia de uma unidade só não vê nada disso: a unidade padrão é criada no onboarding e a UI de rede fica oculta. Multi-unidade **não pode** encarecer a experiência de quem tem uma loja — esse é o critério de aceite mais importante do épico.

### E2 — Cadastros
- **Serviços:** nome, duração (min), preço, ativo/inativo, cor, quais profissionais executam, quais unidades oferecem.
- **Profissionais:** nome, foto, papel, unidade(s), horário de trabalho próprio por unidade, % de comissão.
- **Horário de funcionamento:** por unidade e por dia da semana, com intervalos (ex.: 9–12 e 13–19).
- **Bloqueios:** folga, férias, almoço, feriado — pontuais ou recorrentes, por unidade ou por profissional.

### E3 — Agenda
- Visão **dia** (colunas por profissional, dentro da unidade selecionada) e **semana**.
- Criar/editar/cancelar agendamento manual.
- Estados: `AGENDADO → CONFIRMADO → EM_ATENDIMENTO → CONCLUIDO`, mais `CANCELADO` e `NO_SHOW`.
- Prevenção de conflito de horário garantida no banco.

### E4 — Página pública de agendamento
- Rota `/{tenant}/{unidade}` com nome, logo, endereço, serviços e horários; `/{tenant}` mostra o seletor de unidades (ou redireciona quando há só uma).
- Fluxo de agendamento sem login (nome + telefone).
- Link de cancelamento/remarcação por token.
- Responsivo mobile-first (90%+ do tráfego será celular).

### E5 — Notificações
- Confirmação de agendamento e lembrete 24h e 2h antes.
- Canal do MVP: **e-mail (sempre, fallback obrigatório) + WhatsApp**. Em dev/teste/piloto, WhatsApp via **Evolution API**; migração para API oficial planejada atrás da mesma interface. Riscos, regras de uso e comparativo de provedores oficiais em [14](14-whatsapp-notificacoes.md).

### E6 — Clientes
- Cadastro automático do cliente final na primeira reserva (chave: `tenant_id` + telefone normalizado E.164) — base única na rede.
- Listagem com histórico de atendimentos (com a unidade de cada um) e total gasto.

### E7 — Financeiro básico
- Registro de pagamento ao concluir atendimento (dinheiro, pix, débito, crédito).
- Relatório do período: faturamento, nº atendimentos, ticket médio, no-show, top serviços, comissão por profissional — por unidade e consolidado.

### E8 — Billing SaaS
- Trial 14 dias sem cartão.
- Assinatura recorrente por cartão/Pix; provedor ainda não escolhido — comparativo em [13](13-provedores-pagamento.md), integração atrás da interface `PaymentProvider`.
- Preço em função de profissionais ativos **e número de unidades**.
- Estados da assinatura, com **prazo negociado manualmente** antes de qualquer desativação (ver [08](08-billing-planos.md)).

### E9 — Back-office da plataforma
- Listar tenants, status de assinatura, MRR, e impersonation auditada para suporte.

## Fora do MVP (backlog explícito)

| Item | Por quê fica fora |
|---|---|
| App nativo iOS/Android | Web responsivo resolve; custo alto |
| Pagamento antecipado/sinal pelo cliente | Confirmado fora do MVP; fase 2 (arma contra no-show) |
| Estoque compartilhado / transferência entre unidades | Sem estoque no MVP |
| Caixa consolidado com DRE por unidade | Relatório simples basta no MVP |
| Controle de estoque / venda de produtos | Não é o problema #1 |
| Programa de fidelidade / cupons | Retenção vem depois de aquisição |
| Comanda com múltiplos itens e divisão | Financeiro básico basta no MVP |
| Marketplace / busca de barbearias | Anti-objetivo |
| Integração com Google Calendar | Fase 2 |
| Relatórios avançados / BI | Fase 2 |
| Domínio próprio por tenant (`agenda.suabarbearia.com.br`) | Fase 2 |
| Whitelabel completo | Fase 3 |

## User stories com critérios de aceite

### US-01 — Publicar página de agendamento
> Como **dono**, quero publicar minha página de agendamento para receber marcações sem WhatsApp.

- **Dado** que criei a conta, **quando** completo o wizard, **então** `/{tenant}` responde 200 com os serviços da minha única unidade (sem seletor).
- Slug duplicado é rejeitado com mensagem clara e sugestão alternativa.
- Sem nenhum serviço ativo, a página exibe "agendamento indisponível" em vez de erro.

### US-02 — Agendar como cliente final
> Como **cliente**, quero marcar um horário sem baixar app nem conversar com ninguém.

- Só aparecem slots que respeitam horário da unidade, jornada do profissional naquela unidade, bloqueios, duração do serviço e compromissos do profissional em **outras unidades**.
- Não é possível agendar no passado nem além de 60 dias.
- Telefone é validado e normalizado para E.164.
- Duas reservas simultâneas no mesmo slot: a segunda falha com `409 SLOT_TAKEN`.
- Ao confirmar, o cliente vê o resumo e recebe a confirmação no canal ativo.

### US-03 — Agenda do dia
> Como **barbeiro**, quero ver meus atendimentos de hoje no celular.

- Login leva direto à agenda do dia.
- `STAFF` não enxerga agendamentos de outros profissionais.
- Mudança de status reflete em ≤ 2s para outros usuários do tenant (polling de 30s é aceitável no MVP).

### US-04 — Bloquear horário
> Como **dono**, quero bloquear almoço/folga para não receber marcação nesse período.

- Bloqueio recorrente semanal suportado.
- Criar bloqueio sobre agendamentos existentes exige confirmação e lista os afetados.

### US-05 — Relatório do mês
> Como **dono**, quero saber quanto faturei e quanto devo de comissão.

- Filtro por período e por profissional.
- Totais consideram apenas atendimentos `CONCLUIDO`.
- Exportação CSV.

### US-06 — Assinar
> Como **dono**, quero pagar a mensalidade para continuar usando após o trial.

- Checkout conclui e ativa a assinatura em ≤ 1 min (via webhook).
- Falha de pagamento → estado `PAST_DUE` + e-mail com link de atualização de cartão.
- Nenhuma ação de billing é confiada ao retorno do browser; a fonte da verdade é o webhook.

### US-07 — Operar uma rede
> Como **dono de 3 unidades**, quero ver a agenda de cada loja separadamente e o faturamento da rede junto.

- Trocar de unidade no painel não recarrega a sessão nem exige novo login.
- `MANAGER` da unidade Centro não vê nem edita a agenda da unidade Sul (404).
- Relatório aceita `location_id` ou "todas"; os totais consolidados batem com a soma das unidades.
- Barbeiro vinculado a duas unidades não pode ser agendado no mesmo horário nas duas.
- Cliente cadastrado na unidade A aparece com histórico completo ao agendar na unidade B.

### US-08 — Isolamento entre tenants (requisito não-funcional testável)
> Como **plataforma**, nenhum dado pode vazar entre barbearias.

- Suíte de testes automatizados: para cada endpoint, um usuário do tenant A recebe 404/403 ao acessar recurso do tenant B, **e** um usuário com escopo apenas da unidade X recebe 404 em recurso da unidade Y do mesmo tenant.
- Teste que falha o build se alguma tabela de negócio não tiver `tenant_id` + política RLS.

## Definition of Done do MVP
- Todos os itens E1–E9 (incluindo E1b) entregues e cobertos por testes de integração.
- Suíte de isolamento multi-tenant verde.
- 3 barbearias piloto usando em produção por 2 semanas sem incidente de dados.
- p95 da grade de horários < 500ms; p95 do restante das APIs < 300ms.
