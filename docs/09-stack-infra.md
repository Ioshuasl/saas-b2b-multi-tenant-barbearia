# 09 — Stack e Infraestrutura

## Princípio

Time pequeno. Escolher tecnologia **chata e conhecida**, um repositório, um deploy. Otimizar para velocidade de entrega do MVP e para custo baixo por tenant.

## Stack recomendada

| Camada | Escolha | Alternativa aceitável |
|---|---|---|
| Banco | **PostgreSQL 16** (RLS, `btree_gist`, `tstzrange`) | — (requisito, pelas constraints usadas) |
| Backend | **Node.js + TypeScript** (NestJS ou Fastify) | Laravel/PHP, Django, Spring |
| ORM/query | Prisma ou Drizzle **+ SQL cru** onde o motor de agenda exigir | — |
| Frontend | **React + TypeScript**; Next.js se quiser SSR na página pública | Vue/Nuxt |
| UI | Tailwind + shadcn/ui | — |
| Cache/fila | **Redis** + BullMQ | — |
| Auth | implementação própria (JWT) | Auth0/Clerk se o time preferir comprar |
| E-mail | Resend ou Amazon SES | — |
| WhatsApp | Meta Cloud API (oficial) via BSP | Z-API/Evolution (não oficial, risco de bloqueio) |
| Arquivos | S3/R2 (logos, fotos) | — |
| Hospedagem | Railway/Render/Fly.io no início; AWS/GCP depois | — |
| Observabilidade | Sentry + OpenTelemetry + Grafana/Better Stack | — |
| Analytics produto | PostHog | — |

**SSR na página pública** é desejável: SEO local ("barbearia X agendamento") e primeiro carregamento rápido em 4G. Se usar Next.js, o painel pode ser SPA no mesmo projeto.

**Sobre WhatsApp:** a API oficial exige verificação de empresa, templates aprovados e conta de negócio — pode levar semanas. Planejar o MVP para funcionar sem ela (e-mail + link `wa.me` manual) e ligar o canal quando homologar. Soluções não oficiais têm risco real de banimento do número — evitar em produto pago.

## Estrutura de repositório (monorepo)

```
/apps
  /api          backend (módulos: iam, catalog, scheduling, customers,
                billing, notifications, reporting, platform)
  /web          painel + página pública
  /worker       jobs: lembretes, e-mails, webhooks, relatórios
/packages
  /shared       tipos, validação (zod), utils de data/timezone
  /db           schema, migrações, seeds
/docs
/infra          IaC, docker-compose de dev
```

## Ambientes

| Ambiente | Uso | Dados |
|---|---|---|
| local | docker-compose (postgres, redis, mailhog) + seed com 2 tenants fake | fake |
| staging | espelho de produção, deploy automático da `main` | fake/anonimizado |
| produção | deploy manual/tagged | real |

Seed de desenvolvimento **deve criar dois tenants** — assim qualquer bug de isolamento aparece durante o desenvolvimento, não em produção.

## CI/CD

Pipeline em PR: `lint` → `typecheck` → `testes unitários` → `testes de integração (com Postgres real)` → **`testes de isolamento multi-tenant`** → `build`. Migrações rodam antes do deploy, sempre compatíveis com a versão anterior (expand/contract) para permitir rollback.

## Operação

- Backup diário do Postgres com PITR; **restore testado mensalmente**.
- Health checks `/health` (liveness) e `/ready` (dependências).
- Alertas: taxa de 5xx, p95 de latência, fila de notificações atrasada, falhas de webhook de pagamento, divergência de reconciliação de assinaturas.
- Todo log estruturado em JSON com `request_id` e `tenant_id`.
- Runbooks: incidente de dados, indisponibilidade de provedor de pagamento, fila travada.

## Custo estimado (fase inicial, até ~100 tenants)
Hospedagem + banco gerenciado + Redis: ~US$ 60–120/mês. E-mail: ~US$ 0–20. WhatsApp: por conversa (~R$ 0,08–0,30 cada) — repassar como limite por plano. Custo marginal por tenant é baixo o suficiente para o ticket proposto.
