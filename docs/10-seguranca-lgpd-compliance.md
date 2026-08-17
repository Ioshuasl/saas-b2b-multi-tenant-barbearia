# 10 — Segurança, LGPD e Compliance

> **Aviso.** Este documento é um plano técnico, não parecer jurídico. Antes do lançamento comercial, o conteúdo aqui deve ser revisado por advogado(a) especializado(a) em proteção de dados e as normas citadas reconferidas nas fontes oficiais (consultadas em agosto de 2026). Molde operacional **idêntico** ao prontuário odontológico de referência; o domínio da barbearia **não** trata dado de saúde nem prontuário clínico.

## 1. Base normativa que o produto precisa respeitar

| Norma | O que exige (em linhas gerais) | Impacto no produto |
| --- | --- | --- |
| **LGPD — Lei 13.709/2018** | Base legal para tratamento; direitos do titular; segurança e prevenção de incidentes; registro das operações | Consentimento versionado (marketing), controle de acesso, auditoria, exportação, resposta ao titular, contrato de operador |
| **Marco Civil da Internet** | Guarda de registros de acesso | Log de acesso da aplicação com retenção definida |
| **WhatsApp Business Policy (Meta)** | Opt-in para mensagens de marketing; restrições de conteúdo | Consentimento registrado antes de qualquer mensagem de marketing; templates transacionais sem PII excessiva. Canal default é WAHA (não oficial) — ciência do tenant obrigatória ([ADR-0016](./adr/0016-waha-default-messaging.md)) |

Não se aplicam ao domínio da barbearia: Lei 13.787/2018, Resolução CFO-SEC-91/2009, NGS2, Manual do Prontuário do CFO, Código de Ética Odontológica. Não afirmamos “eliminação de papel” nem prontuário eletrônico.

## 2. Papéis LGPD

| Papel | Quem | Responsabilidade |
| --- | --- | --- |
| **Controlador** | A barbearia / rede (tenant) | Define finalidade do tratamento dos dados dos clientes finais |
| **Operador** | Nós (plataforma) | Tratamos em nome da barbearia, seguindo instruções contratuais |
| **Titular** | Cliente final (e também os usuários da barbearia) | Exerce direitos de acesso, correção, portabilidade, eliminação |
| **Encarregado (DPO)** | Indicado por nós; recomendação de que a barbearia também indique | Canal de comunicação com titulares e ANPD |

Documentos necessários no lançamento: Termos de Uso, Política de Privacidade, **Contrato/Anexo de Operador de Dados (DPA)** com cláusulas de subprocessadores (Hostinger, AWS S3, Resend, Sentry, WAHA/self-hosted), Política de Retenção, Plano de Resposta a Incidentes. Incluir ciência de risco do WhatsApp não oficial.

**Compartilhamento entre unidades:** dentro da mesma rede, o cadastro do cliente é único e visível em todas as unidades. Isso precisa estar explícito no aviso de privacidade da página de agendamento.

## 3. Bases legais por finalidade

| Finalidade | Base legal (proposta) | Observação |
| --- | --- | --- |
| Agendamento e comunicação transacional (confirmação, lembrete) | Execução de contrato | Mensagem transacional: nome, data, hora, unidade — sem notas internas |
| Cadastro do cliente (nome + telefone) | Execução de contrato | Minimização: **sem CPF** no MVP |
| Comunicação de marketing | **Consentimento** específico e revogável (`marketing_opt_in`) | Registrado com data, versão do texto e canal; revogação imediata |
| Cobrança da assinatura SaaS e financeiro do atendimento | Execução de contrato / obrigação legal (fiscal) | Retenção conforme prazo fiscal |
| Métricas de uso do SaaS (nós) | Legítimo interesse | Dados agregados/pseudonimizados; **nunca** telefone/notas |

## 4. Princípio de minimização aplicado ao produto

- Não coletamos dado que não usamos. No autoagendamento: nome + telefone (e-mail opcional). Nada de CPF, RG, filiação, renda.
- Templates de WhatsApp: "Olá {{nome}}, seu horário na {{barbearia}} ({{unidade}}) é dia {{data}} às {{hora}}".
- Logos/fotos ficam em bucket privado, acessíveis somente por URL assinada de curta duração.
- Logs de aplicação não registram corpo de requisição com PII; campos sensíveis são redigidos por allowlist no logger.
- Jobs/filas preferem IDs; não embutir telefone/nome desnecessariamente.

## 5. Controles de segurança

### 5.1 Autenticação e sessão

- Senha com **Argon2id** (parâmetros calibrados: ~64 MB, 3 iterações, paralelismo 1–4), mínimo **10 caracteres**, verificação contra listas de senhas vazadas.
- Access token JWT de 15 min (assinado com chave rotativa) + refresh token opaco de 30 dias, **rotativo**, em cookie `httpOnly; Secure; SameSite=Lax`.
- Detecção de reuso de refresh token → revogação de toda a família de tokens + alerta ao usuário.
- Bloqueio progressivo após tentativas falhas; log de login com IP/agente.
- MFA (TOTP) **obrigatório para `platform_admin` desde o MVP**; opcional para `OWNER` na fase 2.

### 5.2 Autorização

- RBAC por papel (`OWNER`, `MANAGER`, `STAFF`, `RECEPTIONIST`) + escopo de unidade (`user_locations`).
- Checagem no servidor em **toda** rota, nunca só na UI.
- Isolamento de tenant garantido por RLS no banco ([doc 06](./06-multi-tenancy.md)). Recurso de outro tenant → **404**.
- Isolamento entre unidades do mesmo tenant é **autorização de aplicação** (RLS não cobre): usuário com escopo só da unidade X recebe **404** em recurso da unidade Y.
- `STAFF` só acessa os próprios agendamentos (filtro por `staff_id` no servidor).
- Impersonation: só `platform_admin`, motivo obrigatório, TTL curto, **somente leitura** no MVP, banner na UI, `audit_log`.

### 5.3 Criptografia

Modelo **enterprise** (não E2EE no cliente): detalhe operacional em [17 — Baseline de Segurança](./17-seguranca-baseline.md) e [ADR-0007](./adr/0007-criptografia-envelope-tenant.md).

| Onde | Como |
| --- | --- |
| Trânsito | TLS 1.2+ obrigatório, HSTS, redirect 301 de HTTP; TLS também para Postgres/Redis/S3 em produção |
| Repouso (banco) | Criptografia de volume + backups criptografados |
| Repouso (anexos) | SSE no object storage; bucket privado; URL pré-assinada de curta duração |
| Segredos | Env/arquivo na VPS (MVP); Vault depois; **nunca** no repositório; token WAHA por referência (`access_token_ref`) |
| Campos de texto livre (MVP) | **Envelope encryption por tenant** (AES-256-GCM): `customer.notes`, `appointment.notes`; DEK wrapped por KEK **local na VPS** ([ADR-0013](./adr/0013-kms-local-vps.md)); decrypt só após RLS + RBAC |
| Expansão | Fase 2: mais campos, CMEK/SSE-C em anexos, rotação de DEK com re-cifra assíncrona |

### 5.4 Auditoria

`audit_log` registra: quem (usuário/sistema/suporte), o que (ação + recurso + `customer_id` quando aplicável), quando, de onde (IP/agente) e metadados.

Eventos obrigatoriamente auditados:

- Login, logout, falha de login, troca de senha.
- Exportação de dados e download de anexo.
- Alteração de permissão, convite e remoção de usuário.
- Mudança de billing / `grace_until` / suspensão.
- Acesso de suporte da plataforma (break-glass), com notificação ao Owner.
- Envio de mensagem ao cliente (quem/qual template/quando).
- Anonimização LGPD.

Retenção: 12 meses em tabela particionada + arquivamento frio por 5 anos. Auditoria é **append-only**; nem o Owner pode apagar.

Detecção de anomalias: [doc 17 §6](./17-seguranca-baseline.md).

### 5.5 Integridade operacional

1. Overbooking impedido por `EXCLUDE USING gist` no Postgres ([doc 06](./06-multi-tenancy.md)).
2. Preço e duração snapshot em `appointment_services`.
3. Dinheiro em centavos inteiros.
4. Outbox transacional: agregado e evento commitam juntos ([ADR-0006](./adr/0006-filas-bullmq.md)).
5. Exclusão de serviço/profissional com histórico é lógica (`deleted_at`); exclusão física só via rotina LGPD.

### 5.6 Proteções de aplicação

| Ameaça | Controle |
| --- | --- |
| Injeção SQL | ORM parametrizado; `$queryRaw` sempre com placeholders; proibido concatenar SQL |
| XSS | React escapa por padrão; `dangerouslySetInnerHTML` proibido; CSP restritiva |
| CSRF | Tokens em `Authorization` + cookie `SameSite=Lax` só para refresh; refresh exige header customizado |
| IDOR | RLS + 404 cross-tenant; `user_locations` + 404 cross-unidade |
| Enumeração de usuário | Mensagens genéricas em login/recuperação; tempo de resposta constante |
| Brute force / abuso | Rate limit por IP, por tenant e por rota; captcha progressivo na API pública |
| Upload malicioso | Validação de MIME e extensão por allowlist, limite de tamanho, checksum, `Content-Disposition: attachment` |
| SSRF | Sem fetch de URL fornecida por usuário; webhooks só de origens conhecidas com assinatura |
| Dependências vulneráveis | `pnpm audit`/Dependabot no CI; lockfile com versões fixas |
| Segredo vazado | gitleaks no CI; rotação documentada |
| Webhook forjado | Verificação HMAC (WAHA / gateway futuro) antes de enfileirar |

## 6. Direitos do titular — implementação

| Direito | Implementação |
| --- | --- |
| Confirmação e acesso | Solicitação de exportação → pacote CSV/JSON dos dados do cliente; prazo controlado pelo sistema |
| Correção | Edição de cadastro pelo painel da barbearia (controladora) |
| Portabilidade | Exportação em JSON + CSV (dados estruturados) |
| Eliminação | Anonimização: nome → "Cliente removido", telefone/e-mail → null; agendamentos preservados para integridade operacional/contábil |
| Revogação de consentimento | Desliga imediatamente comunicação de marketing; transacional segue por base contratual |
| Informação sobre compartilhamento | Política de Privacidade lista subprocessadores; aviso na página pública de que os dados ficam com a **rede** |

Prazos: o sistema calcula `due_at` (15 dias para acesso/confirmação como parâmetro configurável) e alerta o Owner com antecedência.

## 7. Retenção e eliminação

| Dado | Retenção proposta | Base |
| --- | --- | --- |
| Cadastro e histórico de atendimentos | Enquanto o tenant estiver ativo + 90 dias após cancelamento | Contrato + LGPD |
| Documentos fiscais/financeiros (assinatura SaaS) | 5 anos | Legislação fiscal |
| Registros de acesso da aplicação | 6 meses (mínimo legal) a 12 meses | Marco Civil |
| `audit_log` | 12 meses quente + 5 anos arquivado | Boa prática/compliance |
| Mensagens de WhatsApp | 24 meses (configurável) | Necessidade operacional |
| Dados de tenant cancelado | 90 dias para exportação → anonimização | LGPD + contrato |
| Backups | 30 dias (PITR 7 dias) | Recuperação |

Eliminação é **anonimização irreversível**, não `DELETE` silencioso — mantendo integridade estatística e histórico financeiro agregado.

## 8. Resposta a incidentes

1. **Detecção:** alertas de erro, anomalia de acesso (volume atípico de exportação / 404 cross-tenant), falha de autenticação em massa, sessão WAHA caída, alerta do provedor.
2. **Classificação:** severidade S1–S4; S1 = possível exposição de dado pessoal.
3. **Contenção:** revogar tokens/chaves, isolar recurso, bloquear conta comprometida.
4. **Investigação:** timeline por `audit_log` + logs correlacionados por `requestId`.
5. **Comunicação:** notificar as barbearias afetadas (controladoras) em prazo definido no DPA; apoiar a comunicação à ANPD e aos titulares quando houver risco relevante.
6. **Post-mortem** sem culpabilização, com ações corretivas rastreadas.

Runbooks a escrever antes do lançamento: vazamento de credencial, acesso indevido entre tenants, acesso indevido entre unidades, perda de dado, indisponibilidade prolongada, sessão WAHA comprometida/banida.

## 9. Segurança no ciclo de desenvolvimento

- Revisão de PR obrigatória; nenhum push direto em `main`.
- CI: lint, typecheck, testes, `pnpm audit`, gitleaks, testes de isolamento **tenant e unidade**.
- Ambientes separados (dev/staging/prod) com credenciais distintas; **proibido** dado real de cliente em dev/staging (usar dados sintéticos/anonimizados). Seed local: **dois tenants, um deles com duas unidades**.
- Acesso a produção por perfil mínimo, com MFA e registro.
- Checklist de segurança por feature: onde entra input, quem pode acessar, o que é auditado, o que é logado.
- Fase 2: pentest externo antes de escalar a base de clientes.

## 10. Checklist antes do primeiro cliente pagante

- [ ] Termos de Uso, Política de Privacidade e DPA revisados por advogado(a)
- [ ] Encarregado (DPO) indicado e canal de contato publicado
- [ ] Registro de operações de tratamento (ROPA) preenchido
- [ ] RLS ativa em 100% das tabelas de tenant, com teste automatizado no CI
- [ ] Suíte de escopo de unidade verde no CI
- [ ] Exportação completa dos dados do tenant testada de ponta a ponta
- [ ] Backup com restauração testada (não basta ter backup: é preciso ter restaurado)
- [ ] Rate limit e proteção de rotas públicas validados
- [ ] Sem segredo no repositório (scanner limpo)
- [ ] Comunicação de marketing bloqueada sem consentimento registrado
- [ ] Ciência de risco do WhatsApp não oficial registrada no onboarding
- [ ] Plano de resposta a incidentes escrito e com responsáveis nomeados
