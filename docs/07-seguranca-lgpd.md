# 07 — Segurança e LGPD

## Ameaça #1: vazamento entre tenants

É o risco que mata o produto. Defesa em camadas:

1. **Banco:** RLS em todas as tabelas de negócio; usuário de aplicação sem `BYPASSRLS`; FKs compostas com `tenant_id`.
2. **Aplicação:** `tenant_id` só sai do JWT ou do slug público — nunca de body/query/header controlado pelo cliente.
3. **Testes:** suíte automatizada que, para cada endpoint, tenta acessar recurso do tenant B autenticado como tenant A e exige 404. Roda no CI e bloqueia merge.
4. **Lint de schema:** teste que falha se existir tabela de negócio sem `tenant_id` ou sem policy RLS.
5. **Observabilidade:** alerta se alguma query rodar sem `app.tenant_id` definido fora da allowlist de rotas tenant-less.

## AuthN / AuthZ

- Argon2id para senhas; política mínima de 8 caracteres com verificação contra lista de senhas vazadas.
- JWT de 15 min + refresh rotativo com detecção de reuso (revoga a família de tokens).
- Autorização em duas etapas: **papel** (RBAC da matriz em [02](02-personas-e-jornadas.md)) e **escopo** (`STAFF` só acessa os próprios agendamentos — filtro por `staff_id`, não apenas ocultado na UI).
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
