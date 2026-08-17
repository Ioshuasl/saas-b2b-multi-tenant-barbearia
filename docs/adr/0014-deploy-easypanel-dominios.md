# ADR-0014 — Deploy com EasyPanel; domínios separados app e api

- **Status:** Aceito
- **Data:** 2026-08-17

## Contexto

A aplicação roda em VPS Hostinger ([ADR-0008](./0008-hospedagem-vps-hostinger-s3.md)). Em vez de Caddy/Nginx “na mão” + GitHub Actions SSH como único caminho, o time já opera **EasyPanel** na VPS: orquestra containers, TLS (HTTPS) e binding de domínios.

## Decisão

1. **Plataforma de deploy na VPS:** **EasyPanel**.
2. **Artefatos que o repositório deve fornecer:** `Dockerfile`(s) adequados (`web`, `api`, `worker` — ou multi-stage conforme Compose/EasyPanel) e, se necessário, config **Nginx** (ou equivalente) para o app — o EasyPanel cuida do **HTTPS** (certificados) na borda.
3. **Domínios:**
   - **Um domínio (ou subdomínio) para o app** (Next.js / frontend).
   - **Um domínio (ou subdomínio) para a API** (`/api/v1`).
   - Hostnames concretos são **flexíveis** e configurados no EasyPanel (não hardcodar domínio de produção no código; usar env: `APP_PUBLIC_URL`, `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS`).
4. **CI:** validação no GitHub Actions (lint, typecheck, test, build de imagem) permanece desejável; o **deploy** é promovido via EasyPanel (imagem/registry ou fluxo que o time já usa no painel). Detalhe fino do pipeline pode evoluir sem novo ADR se não mudar a topologia app/api.
5. Postgres e Redis continuam na mesma VPS (Compose/EasyPanel services), conforme ADR-0008.

## Consequências

**Positivas:** reaproveita ops já conhecida; HTTPS e domínios sem reinventar; separação app/api clara para CORS e cookies.

**Negativas:** documentação e onboarding devem citar EasyPanel (não só “docker compose up” genérico); cookies de refresh na API exigem `SameSite`/domínio corretos entre `app.*` e `api.*` (CORS + credentials).

## Verificação

- Env de exemplo com placeholders de URL app/api.
- CORS allowlist só com origem do app.
- Health da API acessível no domínio da API; web no domínio do app.
- Dockerfile(s) buildam no CI.

## Referências

- [ADR-0008 — VPS Hostinger + S3](./0008-hospedagem-vps-hostinger-s3.md)
- [docs/11-infra-devops.md](../11-infra-devops.md)
