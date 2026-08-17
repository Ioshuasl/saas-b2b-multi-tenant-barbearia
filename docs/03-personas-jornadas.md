# 03 — Personas e Jornadas

## 1. Personas

### P1 — Marcos, dono da barbearia (`OWNER`) — comprador e admin

- 2–6 cadeiras; em parte dos casos **2+ unidades**. Android, pouca paciência para configuração. Decide a compra sozinho.
- **Dor:** não sabe quanto entrou no mês nem quanto deve de comissão.
- **Sucesso:** abrir o sistema e ver "hoje: 18 agendamentos, R$ 940".

### P2 — Rafa, barbeiro (`STAFF`) — usuário diário

- Quer saber quem é o próximo e a que horas. Não configura nada.
- **Sucesso:** agenda do dia em uma tela; login cai direto nela.

### P3 — Carla, recepcionista (`RECEPTIONIST`) — opcional

- Marca por telefone/balcão, remarca, cancela, registra pagamento. Escopo só da unidade em `user_locations`.

### P4 — Fernanda, gerente de unidade (`MANAGER`) — redes

- Opera uma ou mais lojas. Vê agenda, equipe e relatório **das unidades do escopo**. Não vê consolidado da rede nem billing.

### P5 — Cliente final (`Customer`) — não é usuário pago

- Chega pelo link no Instagram/WhatsApp. Identifica-se por telefone (E.164).
- **Sucesso:** serviço → profissional ou "qualquer um" → horário → nome + telefone → confirmar (≤ 4 telas).

### P6 — Operador da plataforma (`platform_admin`) — nós

- Tenants, assinaturas, fila de cobrança, impersonation auditada (somente leitura no MVP).

## 2. Jornadas

### J1 — Onboarding do tenant (self-service, meta ≤ 10 min)

1. "Criar conta grátis" → nome da rede, e-mail, senha, telefone → `tenant` + **location** padrão + `OWNER`.
2. Slug público (`/minha-barbearia`) com validação e sugestão.
3. Wizard em 4 passos: horário → serviços (pré-carregados) → profissionais → publicar (link + QR).
4. Trial 14 dias, sem cartão.
5. *(Redes)* "Adicionar unidade" herda catálogo; link e QR por loja. **Oculto com uma unidade só.**

**Critério:** ≥ 60% das contas chegam ao passo "Publicar" ([doc 14](./14-metricas-kpis.md)).

### J2 — Agendamento público (sem login, sem OTP)

1. `/{tenant}` — várias unidades → seletor; uma só → redirect para `/{tenant}/{location}`.
2. Serviço(s) → profissional ou qualquer um → grade (30 dias, lead time da unidade).
3. Nome + telefone + consentimento LGPD.
4. Confirmação na tela + mensagem (WhatsApp e/ou e-mail — [04 — Escopo](./04-escopo-mvp.md) E6).
5. Link de cancelamento/remarcação por token até o prazo da unidade.

**Regra crítica:** concorrência no mesmo slot → `409 SLOT_TAKEN` + grade recarrega; garantido por `EXCLUDE` no Postgres.

### J3 — Dia a dia do barbeiro

1. Login → **agenda de hoje** (`STAFF` só os próprios atendimentos).
2. Status: `SCHEDULED` → `CONFIRMED` → `IN_SERVICE` → `COMPLETED`, ou `NO_SHOW` / `CANCELLED`.
3. Ao concluir: forma de pagamento e valor (pode divergir do tabelado).

### J4 — Gestão do dono

1. Seletor de unidade (oculto se 1).
2. Agenda semana/dia; agendamento manual; bloqueios.
3. Relatório por unidade ou consolidado; comissão.
4. Configurações: unidades, serviços, profissionais, WhatsApp (QR + ciência), assinatura.

### J5 — Assinatura SaaS

1. Banner de trial (dias restantes); aviso D-2 por e-mail.
2. Fim do trial → `PAST_DUE`; **sem checkout** — operação ativa manualmente ([ADR-0010](./adr/0010-billing-saas-manual-mvp.md)).
3. Contato humano + `grace_until` antes de `SUSPENDED`. Página pública off só em `SUSPENDED`. Exportação sempre possível; purge após retenção ([modulos/08-billing-saas.md](./modulos/08-billing-saas.md)).

## 3. Matriz RBAC

`OWNER` vê a rede inteira. Demais papéis: escopo em `user_locations`. Recurso fora do escopo → **404**.

| Ação | OWNER | MANAGER | STAFF | RECEPTIONIST |
| --- | :-: | :-: | :-: | :-: |
| Ver agenda (todos vs própria) | ✅ rede | ✅ unidades | ❌ só própria | ✅ unidade |
| Gerenciar unidades | ✅ | ❌ | ❌ | ❌ |
| Relatório consolidado | ✅ | ❌ | ❌ | ❌ |
| CRUD agendamento alheio | ✅ | ✅ | ❌ | ✅ |
| Status do próprio atendimento | ✅ | ✅ | ✅ | ✅ |
| CRUD serviços / profissionais | ✅ | ✅ | ❌ | ❌ |
| Relatório financeiro | ✅ | ✅ | ❌ (só comissão própria) | ❌ |
| Billing SaaS | ✅ | ❌ | ❌ | ❌ |
| Conectar WhatsApp | ✅ | ❌ | ❌ | ❌ |

Detalhe de permissões: [modulos/01-identidade-acesso.md](./modulos/01-identidade-acesso.md).

## Referências

- [04 — Escopo do MVP](./04-escopo-mvp.md)
- [15 — Glossário](./15-glossario.md) (códigos de status e papéis)
- [08 — API v1](./08-api-v1.md) (matriz de endpoints)
