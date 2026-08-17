# RF — Identidade e Acesso (E1)

**Módulo:** `identity` · **Detalhe:** [modulos/01-identidade-acesso.md](../../modulos/01-identidade-acesso.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E1-01 | Visitante cria barbearia (signup) com e-mail, senha, nome da rede e telefone; o sistema cria Tenant, Location padrão (`is_default`) e usuário `OWNER` em uma única operação atômica | Must | US-01, J1 |
| RF-E1-02 | Sistema rejeita e-mail já cadastrado no tenant com `409` sem revelar se o e-mail pertence a outro tenant | Must | US-01 |
| RF-E1-03 | Senha mínima de **10 caracteres**, verificada contra lista de senhas vazadas; armazenamento com Argon2id | Must | doc 10, RNF-SEC |
| RF-E1-04 | Usuário autentica com e-mail/senha e recebe access token JWT (TTL 15 min) + refresh token rotativo em cookie httpOnly | Must | J3, doc 06/08 |
| RF-E1-05 | Reuso de refresh token revoga toda a família de tokens e registra alerta de segurança | Must | doc 10 |
| RF-E1-06 | Após 5 tentativas de login falhas por minuto (IP+e-mail), o sistema aplica rate limit / bloqueio temporário | Must | doc 08 |
| RF-E1-07 | Usuário renova sessão via refresh sem reinformar senha; logout encerra a sessão atual | Must | doc 08 |
| RF-E1-08 | Usuário solicita e redefine senha por fluxo seguro (token de uso único); resposta de “esqueci senha” não revela se o e-mail existe | Must | E1 escopo |
| RF-E1-09 | Verificação de e-mail no onboarding (link de confirmação) | Must | E1 escopo |
| RF-E1-10 | `OWNER`/`MANAGER` convida profissional por e-mail/link com papel e escopo de unidade(s); convite de uso único válido por 7 dias; pode reenviar ou revogar | Must | E1, J1 |
| RF-E1-11 | Convidado aceita convite, define senha e passa a integrar o tenant com o papel e `user_locations` atribuídos | Must | E1 |
| RF-E1-12 | Sistema aplica papéis `OWNER`, `MANAGER`, `STAFF`, `RECEPTIONIST` com permissões por recurso e escopo de unidade | Must | matriz RBAC doc 03 |
| RF-E1-13 | `STAFF` acessa apenas os próprios agendamentos (filtro por `staff_id` no servidor, não só na UI) | Must | US-03, doc 10 |
| RF-E1-14 | `MANAGER`/`RECEPTIONIST`/`STAFF` só enxergam unidades em `user_locations`; recurso fora do escopo → `404` | Must | US-07, US-08 |
| RF-E1-15 | `OWNER` é a única exceção de escopo de unidade (vê a rede toda); o último `OWNER` do tenant não pode ser removido nem rebaixado | Must | doc 03/06 |
| RF-E1-16 | Usuário consulta identidade atual (`me`): usuário, papel, unidades permitidas e permissões efetivas | Must | API `/me` |
| RF-E1-17 | No MVP, um usuário pertence a um único tenant (multi-membership fica para fase 2) | Must | doc 06 |
| RF-E1-18 | `platform_admin` autentica com MFA obrigatório desde o MVP | Must | doc 10 |

## Critérios de aceite transversais (E1)

- Signup cria todos os artefatos (tenant, unidade padrão, owner, seeds de serviços/horários) ou nenhum.
- Login com senha errada não revela existência do e-mail (tempo/resposta uniformes).
- Tentativa de acesso a recurso de outro tenant → `404`.
- Eventos de auditoria: login, falha, logout, reset de senha, convite, mudança de papel, permissão negada.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E1-19 | MFA TOTP opcional para `OWNER` | Could (fase 2) |
| RF-E1-20 | Membership multi-tenant (mesmo usuário em várias redes) | Could (fase 2) |
| RF-E1-21 | Lista de sessões ativas com revogação individual | Could (fase 2) |
