# 02 — Personas e Jornadas

## Personas

### 1. Dono da barbearia (`OWNER`) — comprador e admin
Tem 2–6 cadeiras (e, em parte dos casos, **mais de uma unidade**), corta cabelo também. Usa celular Android, pouca paciência para configuração. Decide a compra sozinho.
**Dor principal:** não sabe quanto entrou no mês nem quanto deve de comissão.
**Sucesso para ele:** abrir o sistema e ver "hoje: 18 agendamentos, R$ 940".

### 2. Barbeiro / profissional (`STAFF`) — usuário diário
Quer só saber quem é o próximo cliente e a que horas. Não configura nada.
**Sucesso:** agenda do dia em uma tela, sem login complicado.

### 3. Recepcionista (`RECEPTIONIST`) — opcional, barbearias maiores
Marca por telefone/balcão, remarca, cancela, registra pagamento. Escopo restrito à unidade onde trabalha.

### 3b. Gerente de unidade (`MANAGER`) — em redes
O dono delega a operação de uma loja. Vê e administra **apenas as unidades do seu escopo** (`user_locations`): agenda, equipe, horários e o relatório daquela unidade. Não vê o consolidado da rede nem mexe em billing.

### 4. Cliente final (`CUSTOMER`) — não é usuário pago
Chega pelo link no Instagram/WhatsApp da barbearia. Não tem conta; identifica-se por telefone.
**Sucesso:** escolher serviço → barbeiro → horário → confirmar, em ≤ 4 telas.

### 5. Operador da plataforma (`PLATFORM_ADMIN`) — nós
Vê tenants, assinaturas, suporte, e faz impersonation para dar suporte (com auditoria).

## Jornadas

### J1 — Onboarding do tenant (self-service, meta ≤ 10 min)
1. Dono acessa o site, clica em "Criar conta grátis".
2. Informa: nome da barbearia, e-mail, senha, telefone → cria `tenant` + **primeira unidade** + usuário `OWNER`.
3. Escolhe o **slug** público (`/minha-barbearia`), com sugestão automática e validação de disponibilidade.
4. Wizard em 4 passos:
   - **Horário de funcionamento** (por dia da semana, com pré-preenchimento seg–sáb 9h–19h).
   - **Serviços** (pré-carregados: Corte R$40/30min, Barba R$30/20min, Corte+Barba R$60/50min — editáveis).
   - **Profissionais** (o próprio dono já entra como profissional; pode convidar outros por e-mail/link).
   - **Publicar** → mostra o link público e um QR Code para imprimir/colocar no Instagram.
5. Trial de 14 dias inicia automaticamente. Nenhum cartão exigido.
6. *(Opcional, redes)* "Adicionar unidade" repete horário/equipe — o catálogo de serviços é herdado da rede, e cada unidade ganha o próprio link e QR Code. **Nada disso aparece para quem tem uma loja só.**

**Critério de sucesso:** ≥ 60% das contas criadas chegam ao passo "Publicar".

### J2 — Agendamento pelo cliente final (público, sem login)
1. Abre `app.com/minha-barbearia` — com mais de uma unidade, escolhe primeiro a loja (nome, endereço, distância); com uma só, vai direto.
2. Vê serviços com preço e duração → escolhe um (ou mais, somando duração).
3. Escolhe profissional ou "qualquer um disponível".
4. Vê grade de horários disponíveis dos próximos 30 dias (slots calculados a partir de horário de funcionamento − bloqueios − agendamentos existentes).
5. Informa nome + telefone (WhatsApp).
6. Confirma → recebe confirmação na tela + mensagem (WhatsApp/e-mail conforme [03](03-escopo-mvp.md)).
7. Link de cancelamento/remarcação com token, válido até X horas antes.

**Regra crítica:** dois clientes escolhendo o mesmo slot simultaneamente — o segundo recebe erro `SLOT_TAKEN` e a grade recarrega. Garantido por constraint de exclusão no banco, não só por checagem em aplicação.

### J3 — Dia a dia do barbeiro
1. Login → cai direto na **Agenda de hoje** (visão dia, só os próprios atendimentos se for `STAFF`). Se atende em mais de uma unidade, vê os atendimentos das duas na mesma linha do tempo, com a unidade indicada.
2. Marca atendimento como `EM_ATENDIMENTO` → `CONCLUÍDO`, ou `NO_SHOW`.
3. Ao concluir, registra forma de pagamento e valor efetivo (pode divergir do preço tabelado).

### J4 — Gestão do dono
1. Seletor de unidade no topo (oculto quando há uma só).
2. Agenda em visão semana/dia, de todos os profissionais da unidade (colunas por profissional).
3. Criar agendamento manual (cliente que ligou) e bloqueio (almoço, folga, feriado).
4. Relatório do período por unidade **ou consolidado da rede**: faturamento, nº de atendimentos, taxa de no-show, ranking de serviços, comissão por profissional.
5. Configurações: unidades, serviços, profissionais, horários, dados da página pública, assinatura.

### J5 — Assinatura
1. Durante o trial, banner com dias restantes.
2. Dia 12: e-mail de aviso. Dia 14: fim do trial.
3. Sem pagamento → `PAST_DUE`, **sem desativar nada de imediato**: a plataforma entra em contato e negocia um prazo (`NEGOTIATING`, com `grace_until`). A página pública só sai do ar depois de esgotado o prazo acordado — não prejudicar a barbearia é decisão de negócio. Detalhe em [08](08-billing-planos.md). Dados nunca apagados antes de 90 dias.

## Matriz de permissões (RBAC)

`OWNER` vê toda a rede. Os demais papéis são limitados às unidades listadas em `user_locations` — a coluna abaixo já pressupõe esse recorte.

| Ação | OWNER | MANAGER | STAFF | RECEPTIONIST |
|---|:--:|:--:|:--:|:--:|
| Ver agenda de todos | ✅ (rede) | ✅ (suas unidades) | ❌ (só a própria) | ✅ (sua unidade) |
| Gerenciar unidades | ✅ | ❌ | ❌ | ❌ |
| Ver relatório consolidado da rede | ✅ | ❌ | ❌ | ❌ |
| Criar/editar agendamento de qualquer um | ✅ | ✅ | ❌ | ✅ |
| Alterar status do próprio atendimento | ✅ | ✅ | ✅ | ✅ |
| CRUD de serviços | ✅ | ✅ | ❌ | ❌ |
| CRUD de profissionais / convites | ✅ | ✅ | ❌ | ❌ |
| Ver relatórios financeiros | ✅ | ✅ | ❌ (só própria comissão) | ❌ |
| Gerenciar assinatura/billing | ✅ | ❌ | ❌ | ❌ |
| Configurar página pública | ✅ | ✅ | ❌ | ❌ |
