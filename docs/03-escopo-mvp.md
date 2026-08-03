# 03 — Escopo do MVP

Critério de corte: **entra no MVP apenas o que é necessário para uma barbearia real substituir o caderno + WhatsApp e pagar por isso.**

## Dentro do MVP

### E1 — Contas e tenants
- Cadastro self-service de barbearia (cria tenant + OWNER).
- Login por e-mail/senha, recuperação de senha, verificação de e-mail.
- Convite de profissional por link/e-mail.
- Slug público único e editável (com redirect do antigo por 30 dias).

### E2 — Cadastros
- **Serviços:** nome, duração (min), preço, ativo/inativo, cor, quais profissionais executam.
- **Profissionais:** nome, foto, papel, horário de trabalho próprio (pode diferir do da barbearia), % de comissão.
- **Horário de funcionamento:** por dia da semana, com intervalos (ex.: 9–12 e 13–19).
- **Bloqueios:** folga, férias, almoço, feriado — pontuais ou recorrentes.

### E3 — Agenda
- Visão **dia** (colunas por profissional) e **semana**.
- Criar/editar/cancelar agendamento manual.
- Estados: `AGENDADO → CONFIRMADO → EM_ATENDIMENTO → CONCLUIDO`, mais `CANCELADO` e `NO_SHOW`.
- Prevenção de conflito de horário garantida no banco.

### E4 — Página pública de agendamento
- Rota `/{slug}` com nome, logo, endereço, serviços e horários.
- Fluxo de agendamento sem login (nome + telefone).
- Link de cancelamento/remarcação por token.
- Responsivo mobile-first (90%+ do tráfego será celular).

### E5 — Notificações
- Confirmação de agendamento e lembrete 24h e 2h antes.
- Canal do MVP: **e-mail (sempre) + WhatsApp (se configurado)**. WhatsApp via provedor oficial (ver [09](09-stack-infra.md)); se a homologação atrasar, MVP sai só com e-mail + link "avisar no WhatsApp" que abre `wa.me` com texto pronto (envio manual pela barbearia).

### E6 — Clientes
- Cadastro automático do cliente final na primeira reserva (chave: `tenant_id` + telefone normalizado E.164).
- Listagem com histórico de atendimentos e total gasto.

### E7 — Financeiro básico
- Registro de pagamento ao concluir atendimento (dinheiro, pix, débito, crédito).
- Relatório do período: faturamento, nº atendimentos, ticket médio, no-show, top serviços, comissão por profissional.

### E8 — Billing SaaS
- Trial 14 dias sem cartão.
- Assinatura recorrente por cartão/Pix via Stripe **ou** gateway BR (decisão em [12](12-riscos-decisoes.md)).
- Estados da assinatura e bloqueio por inadimplência.

### E9 — Back-office da plataforma
- Listar tenants, status de assinatura, MRR, e impersonation auditada para suporte.

## Fora do MVP (backlog explícito)

| Item | Por quê fica fora |
|---|---|
| App nativo iOS/Android | Web responsivo resolve; custo alto |
| Múltiplas unidades por tenant | Só ~5% do público-alvo; complica o modelo de dados |
| Controle de estoque / venda de produtos | Não é o problema #1 |
| Programa de fidelidade / cupons | Retenção vem depois de aquisição |
| Comanda com múltiplos itens e divisão | Financeiro básico basta no MVP |
| Marketplace / busca de barbearias | Anti-objetivo |
| Pagamento online antecipado pelo cliente | Fricção alta no público; fase 2 (útil contra no-show) |
| Integração com Google Calendar | Fase 2 |
| Relatórios avançados / BI | Fase 2 |
| Domínio próprio por tenant (`agenda.suabarbearia.com.br`) | Fase 2 |
| Whitelabel completo | Fase 3 |

## User stories com critérios de aceite

### US-01 — Publicar página de agendamento
> Como **dono**, quero publicar minha página de agendamento para receber marcações sem WhatsApp.

- **Dado** que criei a conta, **quando** completo o wizard, **então** `/{slug}` responde 200 com meus serviços.
- Slug duplicado é rejeitado com mensagem clara e sugestão alternativa.
- Sem nenhum serviço ativo, a página exibe "agendamento indisponível" em vez de erro.

### US-02 — Agendar como cliente final
> Como **cliente**, quero marcar um horário sem baixar app nem conversar com ninguém.

- Só aparecem slots que respeitam horário de funcionamento, jornada do profissional, bloqueios e duração do serviço.
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

### US-07 — Isolamento entre tenants (requisito não-funcional testável)
> Como **plataforma**, nenhum dado pode vazar entre barbearias.

- Suíte de testes automatizados: para cada endpoint, um usuário do tenant A recebe 404/403 ao acessar recurso do tenant B.
- Teste que falha o build se alguma tabela de negócio não tiver `tenant_id` + política RLS.

## Definition of Done do MVP
- Todos os itens E1–E9 entregues e cobertos por testes de integração.
- Suíte de isolamento multi-tenant verde.
- 3 barbearias piloto usando em produção por 2 semanas sem incidente de dados.
- p95 da grade de horários < 500ms; p95 do restante das APIs < 300ms.
