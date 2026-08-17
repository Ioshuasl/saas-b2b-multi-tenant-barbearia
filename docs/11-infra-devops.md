# 11 — Infraestrutura e DevOps

## 1. Topologia de execução

```
                 ┌───────────────────────┐
   Internet ─────► CDN + WAF             │
                 └───────┬───────────────┘
            ┌────────────┴─────────────┐
            ▼                          ▼
  ┌───────────────────┐      ┌───────────────────┐
  │ web (Next.js)     │      │ api (Express)     │  N réplicas, stateless
  │ SSR/RSC           │      │ /api/v1           │
  └───────────────────┘      └────────┬──────────┘
                                      │
  ┌───────────────────┐               │
  │ worker (BullMQ)   │◄──────────────┤ (mesmo artefato, comando diferente)
  │ jobs + cron       │               │
  └────────┬──────────┘               │
           ▼                          ▼
   ┌──────────────┐         ┌──────────────────┐      ┌──────────────┐
   │ Redis        │         │ PostgreSQL 16+   │      │ Object store │
   │ filas/cache  │         │ primário + PITR  │      │ AWS S3       │
   └──────────────┘         └──────────────────┘      └──────────────┘
```

Todos os processos são stateless (sessão em token, fila no Redis, arquivo no storage) — escala horizontal simples.

Integrações: **WAHA (GOWS)** na mesma VPS · **Resend** · S3 `sa-east-1` · **Sentry**.

## 2. Ambientes

| Ambiente | Uso | Dados | Deploy |
| --- | --- | --- | --- |
| `local` | Desenvolvimento | Seed sintético (Docker Compose) | manual |
| `preview` | Opcional / futuro | Banco efêmero | — (EasyPanel MVP foca staging + prod) |
| `staging` | Homologação/QA e ensaio de migração | Sintético (**nunca** dado real de cliente) | EasyPanel (após CI verde) |
| `production` | Clientes | Real | EasyPanel com aprovação (tag/release) |

Seed de desenvolvimento **deve criar dois tenants, e um deles com duas unidades**.

## 3. Desenvolvimento local

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: barbearia_dev
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
  minio:                       # object storage compatível com S3
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ['9000:9000', '9001:9001']
  mailpit:                     # captura de e-mails
    image: axllent/mailpit
    ports: ['8025:8025', '1025:1025']
volumes:
  pgdata:
```

WAHA de desenvolvimento: instância compartilhada na VPS (`waha.ioshuavps.com.br`) ou container opcional — **não** Evolution API no compose padrão.

```bash
pnpm install
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev            # api :3333 · worker · web :3000
```

Scripts padronizados na raiz: `dev`, `build`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `db:migrate`, `db:reset`, `db:seed`, `openapi:generate`, `arch:check`.

## 4. Configuração e segredos

Validação de ambiente na inicialização — a aplicação **não sobe** com configuração inválida:

```ts
// backend/src/shared/config/env.ts
export const env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  DATABASE_MIGRATION_URL: z.string().url(),      // role app_migrator
  REDIS_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string(),
  STORAGE_REGION: z.string().default('sa-east-1'),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),
  WAHA_BASE_URL: z.string().url().optional(),
  WAHA_API_KEY: z.string().optional(),
  MESSAGING_PROVIDER: z.enum(['waha', 'cloud', 'fake']).default('fake'),
  MAIL_DSN: z.string(),                       // Resend em prod; smtp://mailpit em local
  RESEND_API_KEY: z.string().optional(),
  APP_PUBLIC_URL: z.string().url(),
  CORS_ORIGINS: z.string(),
  SENTRY_DSN: z.string().optional(),
  TENANT_KEK: z.string().optional(),          // obrigatório em production
}).parse(process.env);
// Frontend: NEXT_PUBLIC_API_URL = domínio da API (EasyPanel)
```

Regras: segredos via env injetado pelo EasyPanel / arquivo na VPS ([ADR-0013](./adr/0013-kms-local-vps.md)); `.env` local nunca comitado; rotação de `JWT_*` com suporte a duas chaves ativas (kid); token de WhatsApp por tenant referenciado por `access_token_ref`.

## 5. CI (por PR)

```yaml
# .github/workflows/ci.yml (esboço)
jobs:
  quality:
    steps:
      - pnpm install --frozen-lockfile
      - pnpm lint
      - pnpm typecheck
      - pnpm arch:check
      - pnpm test -- --coverage
      - pnpm audit --audit-level=high
      - gitleaks detect
  integration:
    services: [postgres, redis]
    steps:
      - pnpm db:migrate
      - pnpm test:integration            # inclui testes de RLS/tenant e escopo de unidade
      - pnpm openapi:check
  e2e:
    steps:
      - pnpm build && pnpm start:test
      - pnpm test:e2e                    # Playwright: onboarding, agenda, página pública
```

Merge bloqueado sem: lint, typecheck, arch, unit, integration, e2e verdes + 1 aprovação.

## 6. Deploy

- **Estratégia:** rolling/restart controlado com health check; readiness só responde OK após conexão com banco/redis/storage.
- **Hospedagem (MVP):** VPS **Hostinger** com **EasyPanel** — serviços `web`, `api`, `worker`, `postgres`, `redis` ([ADR-0008](./adr/0008-hospedagem-vps-hostinger-s3.md), [ADR-0014](./adr/0014-deploy-easypanel-dominios.md)).
- **Domínios:** um host para **app** e um para **api** (valores flexíveis no EasyPanel; URLs via env).
- **TLS:** HTTPS gerenciado pelo **EasyPanel**; repositório entrega Dockerfile (+ Nginx se necessário).
- **Anexos:** **AWS S3** região **`sa-east-1`**, bucket privado, upload pré-assinado.
- **Migrações:** executadas em passo separado antes do rollout, com role `app_migrator`. Sempre compatíveis para frente (expand → migrar → contract).
- **Rollback:** imagem/container anterior + migração desfeita apenas se reversível; se não for, corrigimos para frente.
- **Feature flags** simples por tenant (tabela + cache).
- **Janela de manutenção** anunciada no app; agenda é operação crítica em horário comercial → deploys preferencialmente fora de 08:00–19:00.

> Alternativas PaaS (Vercel + Railway/Render/Fly, AWS ECS) foram consideradas e **não** adotadas no MVP — a decisão vigente é ADR-0008.

## 7. Filas e agendamento (BullMQ)

| Fila | Job | Retry | Observação |
| --- | --- | --- | --- |
| `messaging` | `send-whatsapp-message` | 5×, backoff exponencial (30s→8min) | Idempotente por `notifications.id` / `Idempotency-Key` |
| `messaging` | `process-whatsapp-webhook` | 3× | Idempotente por `provider_message_id` |
| `messaging` | `send-email` | 5× | Fallback obrigatório |
| `scheduling` | `schedule-appointment-notifications` | 3× | Cria jobs delayed de 24h e 2h |
| `subscription` | `expire-trials-and-grace` | cron diário 03:00 | Por tenant; **não** suspende antes de `grace_until` |
| `reporting` | `generate-export` | 2× | Resultado no storage com URL assinada |
| `platform` | `dispatch-outbox` | contínuo (5s) | Entrega de eventos de domínio |
| `platform` | `cleanup-expired-tokens` | cron diário | — |
| `platform` | `recalculate-usage-counters` | cron horário | Limites de plano (profissionais + unidades) |

Regras: todo job carrega `tenantId` e `requestId`; jobs mortos vão para DLQ com alerta; nenhum job faz `SELECT` sem contexto de tenant.

## 8. Observabilidade

| Pilar | Agora (MVP) | Futuro (intenção) |
| --- | --- | --- |
| Logs | Pino JSON → stdout/arquivo na VPS (`requestId`, `tenantId`, `locationId`, `userId`; **sem** PII) | Agregar com Loki/Grafana self-hosted na VPS |
| Erros | **Sentry** cloud + scrubbing de PII | GlitchTip / Sentry self-host na VPS |
| Métricas | Health, filas, alertas básicos | Prometheus + Grafana na VPS |
| Tracing | — (fase 2) | OpenTelemetry |

Decisão: [ADR-0012](./adr/0012-observabilidade-sentry-logs.md). Instrumentar via ports para facilitar a migração self-hosted.

Alertas (com dono definido): 5xx > 1% em 5 min · p95 > 1s em 10 min · fila com idade > 10 min · falha de envio WhatsApp > 10% · sessão WAHA desconectada · erro de migração · uso de disco/conexões > 80% · falha de backup · rajada de 404 cross-tenant.

## 9. Backup e continuidade

| Item | Política |
| --- | --- |
| Banco | Snapshot diário + PITR (7 dias); retenção de 30 dias |
| Storage de anexos | Versionamento habilitado; retenção de versão 30 dias |
| Restauração | Ensaiada **mensalmente** no MVP (RNF-DR); trimestral quando a operação estabilizar |
| RPO / RTO | RPO ≤ 15 min · RTO ≤ 4 h (MVP) |
| Exportação por tenant | Sob demanda pelo Owner (JSON + CSV + anexos) — também é plano B de continuidade |

Cenários de contingência: perda do primário (restore), indisponibilidade do WAHA (mensagens na fila; e-mail cobre; UI avisa), indisponibilidade do storage (upload bloqueado), corrupção de dado por bug (PITR + replay de outbox).

## 10. Estimativa de custo mensal (ordem de grandeza, ano 1)

Com hospedagem em VPS própria ([ADR-0008](./adr/0008-hospedagem-vps-hostinger-s3.md)), o custo fixo de compute/DB/Redis é o da VPS Hostinger (já contratada). Itens variáveis/externos:

| Item | Cenário inicial (≤ 50 tenants) | Cenário 500 tenants |
| --- | --- | --- |
| VPS Hostinger (app + Postgres + Redis + WAHA) | conforme plano Hostinger | upgrade de VPS conforme carga |
| Object storage S3 `sa-east-1` + egress | US$ 5–20 | US$ 50–200 |
| Observabilidade (Sentry) | US$ 0–30 | US$ 50–150 |
| E-mail transacional (Resend) | US$ 0–20 | US$ 20–50 |
| WhatsApp (WAHA self-hosted) | custo na VPS/sessão (sem tarifa Meta) | upgrade de RAM |

Implicação: a infraestrutura não é o gargalo de margem; o custo variável relevante é **sessão WhatsApp (RAM)** e **storage**. Ambos precisam de medição por tenant desde o MVP (`usage_counter`).

## 11. Padrões operacionais

- **Runbooks** em `docs/runbooks/` (fase 2): fila travada, migração falhando, sessão WAHA caída, tenant suspenso por engano, restore de backup.
- **On-call** informal no MVP (fundadores), com alertas em canal único.
- **Post-mortem** para todo incidente S1/S2, publicado internamente em 5 dias úteis.
- **Blueprint do ambiente de desenvolvimento** versionado (Docker Compose + scripts) para que qualquer nova máquina/sessão suba o projeto com um comando.
