# Requisitos Não Funcionais (RNF) — MVP

Derivados de [04](../../04-escopo-mvp.md), [10](../../10-seguranca-lgpd-compliance.md), [06](../../06-multi-tenancy.md), [11](../../11-infra-devops.md), [14](../../14-metricas-kpis.md) e decisões da Parte 1. Aplicam-se a todo o sistema, salvo indicação. Segurança OWASP detalhada em [RNF-seguranca-owasp.md](./RNF-seguranca-owasp.md).

---

## 1. Desempenho (`RNF-PERF`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-PERF-01 | Leituras principais da API com latência p95 &lt; 300 ms | Must | DoD MVP, k6/APM |
| RNF-PERF-02 | Grade de horários (availability) com p95 &lt; 500 ms | Must | DoD MVP, US-02 |
| RNF-PERF-03 | Agenda do dia carrega de forma usável no celular do barbeiro | Must | US-03, J3 |
| RNF-PERF-04 | LCP das páginas públicas de agendamento &lt; 2,5 s em 4G | Must | E4, mobile-first |
| RNF-PERF-05 | Bundle da página pública mínimo (sem código do painel) | Must | doc 05 |
| RNF-PERF-06 | Onboarding signup → publicar em &lt; 10 min (p90 &lt; 20 min) | Must | J1, doc 14 |
| RNF-PERF-07 | Relatório que exceda ~2 s de consulta vira exportação assíncrona | Must | reporting |
| RNF-PERF-08 | Cache de disponibilidade por `(tenant, location, staff, dia)` com invalidação em escrita | Should | doc 05 |

---

## 2. Disponibilidade e continuidade (`RNF-AVL`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-AVL-01 | Disponibilidade mensal ≥ 99,5% no MVP | Must | doc 14 |
| RNF-AVL-02 | Processos API e worker stateless, escaláveis horizontalmente | Must | doc 05/11 |
| RNF-AVL-03 | Indisponibilidade do WhatsApp não impede agendar; e-mail cobre; UI avisa | Must | RF-E6-03 |
| RNF-AVL-04 | Sessão Evolution/WAHA desconectada gera alerta (enquanto em uso) | Must | doc 11/14 |
| RNF-AVL-05 | Rolling update com health/readiness antes de receber tráfego | Must | doc 11 |
| RNF-AVL-06 | Deploys preferencialmente fora do pico de agendamentos | Should | operação |

---

## 3. Escalabilidade (`RNF-SCALE`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-SCALE-01 | Custo marginal baixo por tenant (ticket R$ 49–349/mês) | Must | doc 01/11 |
| RNF-SCALE-02 | Listagens paginadas com `limit` máximo 100 e cursor | Must | doc 08 |
| RNF-SCALE-03 | Rate limit por tenant e por IP (API pública) | Must | doc 06/08 |
| RNF-SCALE-04 | Índices compostos com `tenant_id` como primeira coluna | Must | doc 06/07 |
| RNF-SCALE-05 | Fila de jobs com isolamento/partição por tenant (noisy neighbor) | Must | doc 05 |
| RNF-SCALE-06 | Relatórios pesados e exportações em fila | Must | reporting |

---

## 4. Segurança (`RNF-SEC`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-SEC-01 | TLS 1.2+ em trânsito; HSTS; redirect HTTP→HTTPS | Must | doc 10 |
| RNF-SEC-02 | Criptografia em repouso no banco e object storage | Must | doc 10 |
| RNF-SEC-03 | Senhas Argon2id; mínimo 8 caracteres; checagem de senhas vazadas | Must | RF-E1-03 |
| RNF-SEC-04 | Access JWT 15 min + refresh rotativo httpOnly; detecção de reuso | Must | doc 10 |
| RNF-SEC-05 | Autorização no servidor: papel + unidade + escopo `staff_id` | Must | doc 10 |
| RNF-SEC-06 | Isolamento por RLS; role sem `BYPASSRLS`; `SET LOCAL` por transação (Prisma/`TenantPrisma`) | Must | ADR-0002 |
| RNF-SEC-07 | `tenant_id` nunca do body/query/header do cliente | Must | doc 06 |
| RNF-SEC-08 | Segredos fora do repositório; scanner de secrets no CI | Must | doc 10/11 |
| RNF-SEC-09 | Rate limit em auth e rotas públicas; captcha progressivo | Must | doc 08/10 |
| RNF-SEC-10 | Proteções OWASP Top 10 + API Top 10 | Must | [RNF-seguranca-owasp.md](./RNF-seguranca-owasp.md) |
| RNF-SEC-11 | Dependências: audit high+ falha CI; lockfile fixo | Must | qualidade |
| RNF-SEC-12 | Staging/dev sem dado real de cliente | Must | doc 10 |
| RNF-SEC-13 | Suíte automatizada de isolamento **tenant e unidade** em todo PR | Must | US-08 |
| RNF-SEC-14 | Runbook de incidente (detecção, contenção, ANPD) antes do lançamento | Must | doc 10 |
| RNF-SEC-15 | Envelope encryption por tenant (AES-256-GCM) nos campos sensíveis definidos no baseline (ADR-0007) | Must | Decisão F |
| RNF-SEC-16 | DEK plaintext só em memória/cache curto; nunca em log/Sentry/erro | Must | ADR-0007 |
| RNF-SEC-17 | Headers: HSTS, CSP, `nosniff`, Referrer-Policy, Permissions-Policy; `Cache-Control: no-store` em respostas sensíveis | Must | baseline |
| RNF-SEC-18 | MFA obrigatório para `platform_admin`; 2FA `OWNER` fase 2 | Must / Could | doc 10 |
| RNF-SEC-19 | Impersonation somente leitura + auditoria | Must | RF-E9-06 |
| RNF-SEC-20 | `cancel_token` UUID, comparação constant-time | Must | doc 10 |
| RNF-SEC-21 | Detecção de anomalias (refresh reuse, exportação em massa, rajada 404 cross-tenant) | Must | baseline |
| RNF-SEC-22 | ZAP baseline em preview/staging | Should | qualidade |

---

## 5. Privacidade e compliance (`RNF-PRIV`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-PRIV-01 | Barbearia = controladora; plataforma = operadora; DPA/Termos antes do 1º pagante | Must | doc 10 |
| RNF-PRIV-02 | Minimização: nome + telefone (+ e-mail opcional); **sem CPF** no MVP | Must | doc 10 |
| RNF-PRIV-03 | Base legal agendamento = execução de contrato; marketing = consentimento | Must | doc 10 |
| RNF-PRIV-04 | Opt-out de marketing com efeito imediato | Must | RF-E3-08 |
| RNF-PRIV-05 | Aviso na página pública: dados ficam com a **rede** (multi-unidade) | Must | doc 10 |
| RNF-PRIV-06 | Direitos do titular: acesso/portabilidade (CSV), correção, eliminação/anonimização | Must | RF-E9 |
| RNF-PRIV-07 | Retenção: 90 dias pós-cancelamento; audit logs 12 meses; backups 30 dias | Must | doc 10 |
| RNF-PRIV-08 | Logs sem PII desnecessária; scrubbing em ferramenta de erro | Must | doc 10/11 |
| RNF-PRIV-09 | Ciência explícita se piloto usar WhatsApp não oficial | Must | RF-E6-10 |
| RNF-PRIV-10 | Modelo envelope é enterprise (operador processa plaintext em memória), não E2EE — alinhado ao DPA | Must | ADR-0007 |
| RNF-PRIV-11 | Jobs/filas preferem IDs; não embutir telefone/nome desnecessariamente | Must | doc 05 |

---

## 6. Integridade de dados (`RNF-INT`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-INT-01 | Overbooking impedido por `EXCLUDE USING gist` no Postgres | Must | RF-E4-06 |
| RNF-INT-02 | Dinheiro sempre em centavos inteiros | Must | RF-E5-04 |
| RNF-INT-03 | Snapshot de preço/duração no agendamento | Must | RF-E2-12 |
| RNF-INT-04 | Idempotência em pagamentos de atendimento e webhooks de billing | Must | doc 08 |
| RNF-INT-05 | Outbox transacional: agregado e evento commitam juntos | Must | doc 05 |
| RNF-INT-06 | FKs compostas com `tenant_id` (e `location_id` onde operacional) | Must | doc 07 |
| RNF-INT-07 | Máquina de estados de agendamento e assinatura sem transições inválidas | Must | docs 05/billing |

---

## 7. Usabilidade (`RNF-UX`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-UX-01 | Loja única: zero UI de rede (seletor oculto) | Must | E1b |
| RNF-UX-02 | Onboarding self-service ≤ 10 min até publicar | Must | J1 |
| RNF-UX-03 | Agendamento público ≤ 4 telas | Must | J2 |
| RNF-UX-04 | Agenda do barbeiro: uma tela do dia no celular | Must | J3 |
| RNF-UX-05 | Estados de lista: loading, vazio com CTA, erro com retry, sem permissão | Must | frontend |
| RNF-UX-06 | Erros em pt-BR acionáveis; `requestId` em detalhes | Must | doc 08 |
| RNF-UX-07 | Status da agenda nunca só por cor (ícone + texto) | Must | a11y + UX |
| RNF-UX-08 | Transparência de automações / falha de WhatsApp | Must | RF-E6 |

---

## 8. Acessibilidade (`RNF-A11Y`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-A11Y-01 | Navegação por teclado nas telas principais; foco visível | Must | UX |
| RNF-A11Y-02 | Contraste mínimo WCAG AA | Must | UX |
| RNF-A11Y-03 | `aria-live` em toasts e atualizações críticas | Should | UX |
| RNF-A11Y-04 | Zero violações críticas axe-core nas telas principais (e2e) | Should | qualidade |

---

## 9. Internacionalização e localização (`RNF-I18N`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-I18N-01 | Idioma do MVP: pt-BR; textos externalizados | Must | produto BR |
| RNF-I18N-02 | Datas/moeda via `Intl`; timezone **por unidade** na borda; UTC no banco | Must | doc 05/06 |
| RNF-I18N-03 | Telefone em E.164; máscaras BR na UI | Must | domínio BR |

---

## 10. Compatibilidade (`RNF-COMPAT`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-COMPAT-01 | Chrome, Edge, Firefox e Safari nas versões atuais | Must | web |
| RNF-COMPAT-02 | Layout responsivo a partir de ~360 px; mobile-first na página pública e agenda do barbeiro | Must | E4, US-03 |
| RNF-COMPAT-03 | App nativo fora do MVP | Won't | escopo |
| RNF-COMPAT-04 | PWA opcional depois do MVP | Could | escopo |

---

## 11. Observabilidade (`RNF-OBS`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-OBS-01 | Logs JSON (Pino) com `requestId`, `tenantId`, `locationId`, `userId` | Must | doc 11 |
| RNF-OBS-02 | Erros agregados (Sentry) com scrubbing de PII | Must | doc 11 |
| RNF-OBS-03 | Métricas: latência, 5xx, fila, falhas WhatsApp/e-mail, lag outbox, sessão WA | Must | doc 11/14 |
| RNF-OBS-04 | Alertas: 5xx, p95, fila atrasada, webhook billing, sessão Evolution/WAHA, reconciliação | Must | doc 11 |
| RNF-OBS-05 | Instrumentação de produto (PostHog ou equivalente) com eventos do doc 14 | Must | doc 14 |
| RNF-OBS-06 | Tracing distribuído (OpenTelemetry) | Could (fase 2) | doc 11 |

---

## 12. Backup e recuperação (`RNF-DR`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-DR-01 | Backup diário do Postgres + PITR; retenção conforme doc 10/11 | Must | doc 10/11 |
| RNF-DR-02 | Restore **testado mensalmente** | Must | doc 10 |
| RNF-DR-03 | Object storage versionado para logos/fotos | Should | doc 11 |
| RNF-DR-04 | RPO/RTO definidos no runbook (ordem de grandeza: RPO ≤ 15 min, RTO ≤ 4 h no MVP) | Must | operação |
| RNF-DR-05 | Exportação do tenant pelo `OWNER` como plano B | Must | RF-E9-08 |

---

## 13. Manutenibilidade e qualidade (`RNF-QUAL`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-QUAL-01 | TypeScript `strict` + lint de fronteiras (Clean Architecture / módulos Orius) | Must | docs 05/16 |
| RNF-QUAL-02 | CI bloqueia merge sem lint, typecheck, arch check, unit, integration (Postgres real) | Must | doc 11 |
| RNF-QUAL-03 | Cobertura mínima: `models/` ≥ 85%; services altos; suíte de isolamento obrigatória | Must | doc 05 |
| RNF-QUAL-04 | OpenAPI gerado dos Zod; quebra sem bump de versão falha o build | Must | ADR-0003 |
| RNF-QUAL-05 | Migrações Prisma + SQL manual para RLS, EXCLUDE, views | Must | ADR-0004 |
| RNF-QUAL-06 | DoD por história: testes, RLS, escopo de unidade, auditoria quando sensível | Must | doc 04 |
| RNF-QUAL-07 | Jobs idempotentes, com `tenantId`, retry limitado e DLQ | Must | filas |
| RNF-QUAL-08 | Um artefato API + worker; fronteiras verificadas automaticamente | Must | ADR-0001 |

---

## 14. Matriz rápida — categorias × prioridade MVP

| Categoria | Must (resumo) |
| --- | --- |
| Desempenho | p95 API &lt; 300 ms; availability &lt; 500 ms; onboarding &lt; 10 min |
| Disponibilidade | 99,5%; degradação graciosa sem WhatsApp |
| Escala | paginação; rate limit por tenant; índices com `tenant_id` |
| Segurança | TLS, Argon2id, RLS, envelope, OWASP, isolamento unidade |
| Privacidade | LGPD, minimização, rede como base de clientes, DPA |
| Integridade | EXCLUDE, centavos, snapshot, outbox, idempotência |
| UX | loja única simples; ≤ 4 telas no público; erros acionáveis |
| A11y | teclado + contraste AA |
| i18n | pt-BR; timezone por unidade |
| Compat | browsers atuais; ≥ 360 px |
| Observabilidade | logs, métricas, alertas, sessão WA |
| DR | backup + restore mensal |
| Qualidade | CI completo, OpenAPI, DoD, isolamento no PR |

## Referências

- [04 — Escopo do MVP](../../04-escopo-mvp.md)
- [06 — Multi-Tenancy](../../06-multi-tenancy.md)
- [10 — Segurança, LGPD](../../10-seguranca-lgpd-compliance.md)
- [11 — Infraestrutura](../../11-infra-devops.md)
- [14 — Métricas](../../14-metricas-kpis.md)
- [Checklist OWASP](./RNF-seguranca-owasp.md)
- [Requisitos funcionais](../README.md)
