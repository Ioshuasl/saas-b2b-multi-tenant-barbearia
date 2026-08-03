# 09 — Stack e Infraestrutura

## Princípio

Time pequeno. Um repositório, um deploy. Otimizar para velocidade de entrega do MVP e custo baixo por tenant.

## Stack definida

| Camada | Escolha |
|---|---|
| Banco | **PostgreSQL 16** (RLS, `btree_gist`, `tstzrange`) — requisito, pelas constraints usadas |
| Backend | **Node.js + TypeScript + Express** |
| ORM | **Sequelize** (+ SQL cru onde o motor de agenda exigir) |
| Validação | `zod` na fronteira HTTP (Express não valida nada por padrão) |
| Frontend | **React + TypeScript + Next.js** |
| UI | Tailwind + shadcn/ui |
| Cache/fila | **Redis** + BullMQ |
| Auth | implementação própria (JWT + argon2id) |
| E-mail | Resend ou Amazon SES |
| WhatsApp | **Evolution API** em dev/teste; API oficial depois — ver [14](14-whatsapp-notificacoes.md) |
| Pagamentos | a definir — ver [13](13-provedores-pagamento.md) |
| Arquivos | S3/R2 (logos, fotos) |
| Hospedagem | Railway/Render/Fly.io no início; AWS/GCP depois |
| Observabilidade | Sentry + OpenTelemetry + Grafana/Better Stack |
| Analytics produto | PostHog |

### Consequências da stack escolhida

**Express** não traz estrutura: definir desde o começo a organização em módulos (`routes` → `controller` → `service` → `repository`), um error handler central que traduz exceções de domínio para o formato de erro de [06](06-api.md), e `express-async-errors` (ou wrapper) para que rejeição de promise não derrube o processo.

**Sequelize + RLS** exige disciplina. Riscos concretos e como tratar:
- Sequelize não conhece RLS: **toda** query precisa rodar dentro da transação com `SET LOCAL app.tenant_id` (padrão `withTenant` em [04](04-arquitetura-multi-tenancy.md)). Sem hook global que falhe na ausência dela, um `Model.findAll()` solto vaza ou quebra.
- Constraints avançadas (`EXCLUDE USING gist`, `btree_gist`, policies RLS) **não são expressas em modelos Sequelize** — vão em migrations com SQL cru. Nunca usar `sequelize.sync()`; migrations versionadas com `umzug`/`sequelize-cli` são a fonte da verdade do schema.
- O cálculo de disponibilidade e os relatórios devem ser **SQL cru** (`sequelize.query`) com `tstzrange`; tentar expressá-los no query builder gera consulta lenta e ilegível.
- Tipagem: usar `Model.init` com `InferAttributes`/`InferCreationAttributes` para não perder o TypeScript.

**Next.js**: página pública em SSR (SEO local "barbearia X agendamento" e primeiro carregamento em 4G); painel como client-side no mesmo projeto, com bundle separado por rota para o cliente final não baixar código do painel.

## Estrutura de repositório (monorepo)

```
/apps
  /api          Express + TypeScript
                módulos: iam, locations, catalog, scheduling, customers,
                         billing, notifications, reporting, platform
  /web          Next.js: painel + página pública
  /worker       BullMQ: lembretes, e-mails, webhooks, relatórios
/packages
  /shared       tipos, schemas zod, utils de data/timezone
  /db           modelos Sequelize, migrations (SQL cru p/ RLS e constraints), seeds
/docs
/infra          IaC, docker-compose de dev
```

## Ambientes

| Ambiente | Uso | Dados |
|---|---|---|
| local | docker-compose (postgres, redis, mailhog, **evolution-api**) + seed | fake |
| staging | espelho de produção, deploy automático da `main` | fake/anonimizado |
| produção | deploy manual/tagged | real |

Seed de desenvolvimento **deve criar dois tenants, e um deles com duas unidades** — assim tanto bug de isolamento entre redes quanto vazamento entre unidades aparecem durante o desenvolvimento, não em produção.

## CI/CD

Pipeline em PR: `eslint` → `tsc --noEmit` → `testes unitários (vitest/jest)` → `testes de integração (Postgres real via testcontainers ou service container)` → **`testes de isolamento multi-tenant e multi-unidade`** → `build`. Migrações rodam antes do deploy, sempre compatíveis com a versão anterior (expand/contract) para permitir rollback.

## Operação

- Backup diário do Postgres com PITR; **restore testado mensalmente**.
- Health checks `/health` (liveness) e `/ready` (dependências).
- Alertas: taxa de 5xx, p95 de latência, fila de notificações atrasada, falhas de webhook de pagamento, divergência de reconciliação de assinaturas.
- Todo log estruturado em JSON (pino) com `request_id`, `tenant_id` e `location_id`.
- Alerta específico de **sessão da Evolution API desconectada** enquanto ela estiver em uso.
- Runbooks: incidente de dados, indisponibilidade de provedor de pagamento, fila travada.

## Custo estimado (fase inicial, até ~100 tenants)
Hospedagem + banco gerenciado + Redis: ~US$ 60–120/mês. E-mail: ~US$ 0–20. WhatsApp: zero na Evolution API (fase dev), depois custo por mensagem de template *utility* na API oficial — ver [14](14-whatsapp-notificacoes.md). Custo marginal por tenant é baixo o suficiente para o ticket proposto.
