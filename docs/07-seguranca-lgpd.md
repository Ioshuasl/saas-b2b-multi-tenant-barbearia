# 07 — Segurança e LGPD

## Ameaça #1: vazamento entre tenants

É o risco que mata o produto. Defesa em camadas:

1. **Banco:** RLS em todas as tabelas de negócio; usuário de aplicação sem `BYPASSRLS`; FKs compostas com `tenant_id`.
2. **Aplicação:** `tenant_id` só sai do JWT ou do slug público — nunca de body/query/header controlado pelo cliente.
3. **Testes:** suíte automatizada que, para cada endpoint, tenta acessar recurso do tenant B autenticado como tenant A e exige 404. Roda no CI e bloqueia merge.
4. **Lint de schema:** teste que falha se existir tabela de negócio sem `tenant_id` ou sem policy RLS.
5. **Observabilidade:** alerta se alguma query rodar sem `app.tenant_id` definido fora da allowlist de rotas tenant-less.
6. **Sequelize:** hook global `beforeFind`/`beforeSave` que lança erro se não houver transação com tenant no `AsyncLocalStorage` — sem isso, um `Model.findAll()` esquecido é o vetor mais provável de falha.

## Ameaça #2: vazamento entre unidades do mesmo tenant

**A RLS não protege contra isso** — ela filtra por `tenant_id`, e as duas unidades pertencem ao mesmo tenant. O gerente da unidade Centro que consegue ler a agenda ou o faturamento da unidade Sul é uma falha de autorização de aplicação, e precisa de teste próprio.

Defesas:
1. Toda query operacional recebe o filtro `location_id IN (escopo do usuário)`, resolvido de `user_locations` no middleware — nunca do parâmetro cru da request.
2. `OWNER` é a única exceção (vê a rede toda); a exceção é explícita e testada.
3. Suíte no CI: usuário com escopo apenas da unidade X recebe **404** em recurso da unidade Y, para cada endpoint.
4. `location_id=all` em relatórios só é aceito de quem tem escopo total; caso contrário o filtro é reduzido silenciosamente.

## AuthN / AuthZ

- Argon2id para senhas; política mínima de 8 caracteres com verificação contra lista de senhas vazadas.
- JWT de 15 min + refresh rotativo com detecção de reuso (revoga a família de tokens).
- Autorização em três etapas: **papel** (RBAC da matriz em [02](02-personas-e-jornadas.md)), **unidade** (`user_locations`) e **escopo pessoal** (`STAFF` só acessa os próprios agendamentos — filtro por `staff_id`, não apenas ocultado na UI).
- 2FA opcional para `OWNER` (fase 2); obrigatório para `platform_admin` desde o MVP.

## Impersonation (suporte)

- Só `platform_admin`, com motivo obrigatório, token de 30 min, banner visível na UI, e registro em `audit_logs`.
- Impersonation é **somente leitura** no MVP.

## Segurança da API pública

- Rate limit por IP e por slug; captcha progressivo.
- Não expor telefone/e-mail de clientes em nenhum endpoint público — o `GET` de agendamento por token retorna dados mascarados.
- `cancel_token` é UUID aleatório, comparado em tempo constante, invalidado após cancelamento.
- CORS restrito; CSP; sem dados sensíveis no bundle.

## Dados e LGPD

**Papéis:** a barbearia é **controladora** dos dados dos clientes finais; a plataforma é **operadora**. Isso precisa estar no contrato/Termos de Uso, com um DPA (Data Processing Agreement) anexo.

**Base legal:** execução de contrato para o agendamento (nome + telefone). Marketing exige consentimento separado (`marketing_opt_in`), com opt-out em toda mensagem.

**Minimização:** coletamos nome, telefone e, opcionalmente, e-mail. Não coletar CPF no MVP.

**Compartilhamento entre unidades:** dentro da mesma rede, o cadastro do cliente é único e visível em todas as unidades. Isso precisa estar explícito no aviso de privacidade da página de agendamento ("seus dados ficam com a rede X"), porque o titular pode presumir que está se cadastrando só naquela loja.

**WhatsApp não oficial:** enquanto a Evolution API estiver em uso, as mensagens passam por infraestrutura não homologada pela Meta. Isso deve constar do contrato com a barbearia piloto, com ciência registrada — ver [14](14-whatsapp-notificacoes.md).

**Direitos do titular:**
- Portabilidade/acesso: exportação CSV dos dados de um cliente.
- Exclusão: rotina que anonimiza o `customer` (nome → "Cliente removido", telefone/e-mail → null) preservando os agendamentos para integridade contábil.
- Canal de contato do encarregado (DPO) publicado.

**Retenção:**
- Tenant cancelado: dados mantidos por 90 dias (permite reativação), depois exclusão/anonimização.
- Logs de auditoria: 12 meses.
- Backups: 30 dias, criptografados.

**Segurança de infraestrutura:**
- TLS obrigatório; HSTS.
- Criptografia em repouso no banco e nos backups.
- Secrets em gerenciador de segredos, nunca no repositório; rotação documentada.
- Backup diário com **teste de restore mensal** (backup não testado não é backup).
- Princípio do menor privilégio nas credenciais de banco (app ≠ migração ≠ leitura analítica).

**Resposta a incidentes:** runbook com detecção, contenção, avaliação de risco, comunicação à ANPD e aos titulares nos prazos legais, e post-mortem. Definir antes do lançamento, não depois do incidente.
