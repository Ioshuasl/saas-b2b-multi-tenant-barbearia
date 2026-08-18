# SaaS B2B Multi-Tenant para Barbearias

Agenda online, página pública de agendamento e gestão para redes de barbearia.

**Stack:** Node.js + TypeScript + Express · Prisma · PostgreSQL (RLS) · Next.js.

## Desenvolvimento local (Sprint 0)

```bash
cp .env.example .env
# gerar JWT_PRIVATE_KEY / JWT_PUBLIC_KEY (Base64 de PEM PKCS8 / SPKI)
docker compose up -d
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

- API: http://localhost:3333/api/v1/health
- Web: http://localhost:3000/login
- Mailpit: http://localhost:8025
- MinIO: http://localhost:9001

Seed: tenant **Navalha** (1 unidade) e **Corte Fino** (Centro + Jardim). Senha de dev: `Devpass10!`.

Documentação: [`docs/README.md`](./docs/README.md). Checklist da S0: [`docs/desenvolvimento/sprints/S0-fundacao.md`](./docs/desenvolvimento/sprints/S0-fundacao.md).
