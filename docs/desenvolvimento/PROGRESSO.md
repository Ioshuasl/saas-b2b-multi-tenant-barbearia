# Progresso de desenvolvimento (log)

Append-only. Entradas mais recentes no topo.

---

## 2026-08-18 — S0 código (aceite local)

### Feito

- Monorepo pnpm (`backend`, `frontend`, `contracts`) + Compose (Postgres 16, Redis, MinIO, Mailpit)
- Express `/health` `/ready`, env Zod, helmet/CORS/rate limit/requestId
- Prisma + RLS (`location`, `user`, `user_location`, `tenant_crypto_key`, `audit_log`, `outbox_event`)
- Seed Navalha (1 unidade) + Corte Fino (Centro/Jardim + MANAGER só Centro)
- Probe `GET /api/v1/locations/:id` (M1): A→B 404; gerente Centro→Jardim 404
- `KeyManagementPort` local + `test:kms`
- Next.js `/login` mock + shell `(app)`
- CI quality + integration; runbooks em `docs/desenvolvimento/runbooks/`

### Validação

- `pnpm test:kms` · `pnpm test:rls` · `pnpm test:locations` · `pnpm typecheck` · `pnpm arch:check` · `pnpm lint` verdes localmente

### Próximo

- Sprint 1 — signup/login/convite/RBAC + CRUD unidades
- Confirmar CI verde no GitHub após push

---

## 2026-08-18 — S0 planejada (checklist)

### Feito

- Pasta `docs/desenvolvimento/` (README, PROGRESSO, sprints)
- Checklist [`sprints/S0-fundacao.md`](./sprints/S0-fundacao.md): monorepo, Compose, Prisma+RLS, CI, `/health`, Next.js mock, KMS stub, seed 2 tenants (1 com 2 unidades), marco **M1**
- 6 blocos (5 backend + 1 frontend); cortes fechados (sem signup/login real; sem WAHA no compose; sem Dockerfiles EasyPanel)

### Validação

- Fontes: [docs/13](../13-roadmap-estimativas.md) S0/M1, [docs/17](../17-seguranca-baseline.md) §12, [docs/11](../11-infra-devops.md), [docs/16](../16-estrutura-de-pastas.md), RF-E9-01/02/03/10/11/13/18

### Próximo

- S0 Bloco 1 — monorepo pnpm + Docker Compose
