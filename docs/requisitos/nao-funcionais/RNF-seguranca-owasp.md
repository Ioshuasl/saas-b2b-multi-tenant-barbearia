# RNF — Checklist OWASP (MVP)

Status padrão: **Planejado**. Atualizar para `Em implementação` / `Atendido` durante o desenvolvimento.

Fontes: [10 — LGPD](../../10-seguranca-lgpd-compliance.md), [06 — Multi-Tenancy](../../06-multi-tenancy.md), [17 — Baseline](../../17-seguranca-baseline.md) (Parte 4), [ADR-0002](../../adr/0002-multi-tenancy-rls.md), [ADR-0007](../../adr/0007-criptografia-envelope-tenant.md) (Parte 4).

---

## 1. OWASP Top 10 (2021)

| ID | Item OWASP | Requisito | Prioridade | Status |
| --- | --- | --- | --- | --- |
| RNF-OWASP-A01 | A01 Broken Access Control | RBAC + escopo de unidade; RLS; outro tenant → 404; outro location fora do escopo → 404; testes no CI | Must | Planejado |
| RNF-OWASP-A02 | A02 Cryptographic Failures | TLS 1.2+; Argon2id; envelope AES-256-GCM por tenant (ADR-0007); segredos no secret manager/KMS | Must | Planejado |
| RNF-OWASP-A03 | A03 Injection | Prisma parametrizado; `$queryRaw` só com placeholders; Zod em body/query/params | Must | Planejado |
| RNF-OWASP-A04 | A04 Insecure Design | Threat model leve por épico; deny-by-default; EXCLUDE anti-overbooking; outbox; idempotência | Must | Planejado |
| RNF-OWASP-A05 | A05 Security Misconfiguration | `helmet`, CORS allowlist, CSP, env Zod (app não sobe inválido), sem stack trace em prod | Must | Planejado |
| RNF-OWASP-A06 | A06 Vulnerable Components | audit high+ falha CI; lockfile; Dependabot/Renovação | Must | Planejado |
| RNF-OWASP-A07 | A07 Auth Failures | JWT 15 min; refresh rotativo + reuso; rate limit auth; reset sem enumeração; MFA `platform_admin` | Must | Planejado |
| RNF-OWASP-A08 | A08 Integrity Failures | webhook HMAC/assinatura; OpenAPI diff; lockfile; snapshot de preços | Must | Planejado |
| RNF-OWASP-A09 | A09 Logging & Monitoring | `audit_logs`; Pino com redaction; anomalias; alerta sessão WA | Must | Planejado |
| RNF-OWASP-A10 | A10 SSRF | Sem fetch de URL fornecida por usuário; webhooks de origens conhecidas com assinatura | Must | Planejado |

---

## 2. OWASP API Security Top 10

| ID | Item API | Requisito | Prioridade | Status |
| --- | --- | --- | --- | --- |
| RNF-API-01 | API1 BOLA | Autorização por objeto via RLS + `user_locations`; nunca `tenantId` do body como fonte de verdade | Must | Planejado |
| RNF-API-02 | API2 Broken Auth | Fluxos de [RF E1](../funcionais/01-identidade-acesso.md); cookie refresh httpOnly | Must | Planejado |
| RNF-API-03 | API3 BOPLA | Response schemas; omitir campos internos; `STAFF` sem agenda alheia; máscara na API pública | Must | Planejado |
| RNF-API-04 | API4 Resource Consumption | Rate limit IP/tenant/rota; `limit` ≤ 100; body limitado; export/relatório pesado em fila | Must | Planejado |
| RNF-API-05 | API5 BFLA | `authorize(permission)` por endpoint; matriz papel × rota × unidade testada | Must | Planejado |
| RNF-API-06 | API6 Business Flow | `Idempotency-Key` em pagamento/webhook; máquina de estados; limite de bookings por telefone | Must | Planejado |
| RNF-API-07 | API7 SSRF | Igual RNF-OWASP-A10; presign valida tipo/tamanho antes da URL | Must | Planejado |
| RNF-API-08 | API8 Misconfiguration | Headers de segurança; CORS; `/internal/*` e `/platform/*` fora do OpenAPI público quando aplicável | Must | Planejado |
| RNF-API-09 | API9 Inventory | OpenAPI gerado dos Zod; CI falha em rota não versionada / quebra sem bump | Must | Planejado |
| RNF-API-10 | API10 Unsafe Consumption | Validar webhooks de pagamento/WhatsApp; timeout; erros de provedor → 503 sem vazar detalhe interno | Must | Planejado |

---

## 3. Controles de criptografia e endpoints (complemento)

| ID | Requisito | Prioridade | Status |
| --- | --- | --- | --- |
| RNF-CRYPTO-01 | Envelope encryption nos campos sensíveis do MVP definidos no baseline (ADR-0007) — sem impedir busca por telefone E.164 | Must | Planejado |
| RNF-CRYPTO-02 | DEK por tenant wrapped por KEK no KMS; plaintext DEK só em memória/cache curto | Must | Planejado |
| RNF-CRYPTO-03 | AAD (tenantId + recurso) na autenticação GCM; decrypt com AAD errado falha | Must | Planejado |
| RNF-CRYPTO-04 | Ciphertext e DEK nunca em log, Sentry, analytics ou mensagem de erro | Must | Planejado |
| RNF-CRYPTO-05 | TLS em hops API↔Postgres, API↔Redis, API↔ObjectStorage, API↔KMS em produção | Must | Planejado |
| RNF-CRYPTO-06 | Webhooks de pagamento/WhatsApp com verificação de assinatura antes de enfileirar | Must | Planejado |
| RNF-CRYPTO-07 | Respostas autenticadas com dado sensível usam `Cache-Control: no-store` | Must | Planejado |
| RNF-CRYPTO-08 | mTLS entre API e worker | Could (fase 2) | Planejado |

---

## 4. Detecção de anomalias

| ID | Requisito | Prioridade | Status |
| --- | --- | --- | --- |
| RNF-ANOM-01 | Reuso de refresh revoga família e alerta | Must | Planejado |
| RNF-ANOM-02 | Exportação em massa / downloads excessivos geram alerta | Must | Planejado |
| RNF-ANOM-03 | Rajada de 404 cross-tenant endurece rate limit e alerta | Should | Planejado |
| RNF-ANOM-04 | Impersonation / break-glass sempre auditado (e notificação quando política exigir) | Must | Planejado |
| RNF-ANOM-05 | Mudança de papel para `OWNER` gera alerta | Should | Planejado |
| RNF-ANOM-06 | Queda de sessão Evolution/WAHA gera alerta operacional | Must | Planejado |

---

## 5. Verificação sugerida (quando implementar)

- Testes RLS + BOLA (dois tenants)
- Testes de escopo de unidade (MANAGER X ≠ unidade Y)
- Teste de ciphertext no banco ≠ plaintext (campos envelopados)
- Teste de redaction no logger
- Concorrência de slot (N requests → 1 sucesso)
- ZAP baseline em preview/staging
- gitleaks + audit no CI
