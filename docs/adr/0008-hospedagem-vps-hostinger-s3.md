# ADR-0008 — Hospedagem em VPS própria (Hostinger) + AWS S3 para anexos

- **Status:** Aceito
- **Data:** 2026-08-17
- **Contexto do projeto:** MVP do SaaS de barbearias multi-tenant

## Contexto

O [doc 11](../11-infra-devops.md) legado listava alternativas de PaaS (Vercel + Node gerenciado, AWS ECS, Railway/Render). O time já possui **VPS própria na Hostinger** (mesmo padrão do prontuário odontológico de referência) e deseja utilizá-la como ambiente de deploy do produto, limitando serviço externo de infraestrutura a **AWS S3** para armazenamento de logos/fotos.

## Decisão

1. **Hospedagem da aplicação** (Next.js web, API Express, worker BullMQ) roda na **VPS Hostinger** do projeto.
2. **Postgres e Redis** rodam **na mesma VPS** (Docker Compose / EasyPanel: `web`, `api`, `worker`, `postgres`, `redis`) — MVP.
3. **Object storage** (logos, fotos de unidade/profissional) usa **AWS S3** na região **`sa-east-1` (São Paulo)**; bucket privado; upload pré-assinado. Único serviço de object storage externo decidido neste ADR.
4. Deploy, TLS de borda, processos e bancos de aplicação são responsabilidade operacional da VPS.
5. Documentos anteriores que “recomendavam Railway/Render/Fly” passam a ser **alternativa descartada para o MVP**; a fonte da verdade é este ADR.

### Fora do escopo deste ADR (próximas decisões / outros ADRs)

- EasyPanel, domínios app/api e Dockerfiles — [ADR-0014](./0014-deploy-easypanel-dominios.md)
- KMS/secret manager — [ADR-0013](./0013-kms-local-vps.md)
- Provedor de e-mail — [ADR-0009](./0009-email-resend.md)
- Cotas de storage por plano (valores GB) — política de produto

## Consequências

**Positivas**

- Custo previsível de hospedagem já contratado.
- Compose único: app + Postgres + Redis no mesmo host — DX local alinhada à produção.
- S3 em `sa-east-1`: latência BR e narrativa LGPD mais simples.
- S3 adequado a upload pré-assinado, SSE e cotas por plano.

**Negativas / custos aceitos**

- Ops na VPS: patch de SO, firewall, backups, restart, disco, memória — on-call é do time.
- Postgres/Redis no mesmo host = noisy neighbor de CPU/IO; mitigar com limites de container, monitoramento de disco e upgrade de VPS quando necessário.
- Escalabilidade horizontal é manual; aceitável no MVP.
- HA/failover não nativos; mitigar com backup (dump + WAL/PITR-equivalent), healthchecks e runbook de restore.
- Next.js na VPS exige processo Node próprio — aceito.
- Mistura Hostinger + AWS: IAM com escopo mínimo só no bucket do produto.

## Alternativas rejeitadas (para o MVP)

**Vercel (web) + Railway/Render (api):** rejeitado — VPS já disponível e preferida pelo time.

**Tudo na AWS (ECS + RDS + S3):** rejeitado por complexidade operacional no momento; S3 isolado permanece.

**Object storage só em disco da VPS:** rejeitado — fotos/logos crescem; S3 (ou compatível) era requisito de arquitetura; confirma uso de S3.

## Verificação

- Ambientes `local` / `staging` / `production` documentados com Compose (ou similar) na VPS.
- Upload/download de anexo só via URL pré-assinada S3; bucket privado.
- Backup do Postgres na VPS ensaiado; política alinhada ao [doc 11](../11-infra-devops.md).
- Secrets (S3 keys, JWT, DB) fora do repositório.

## Referências

- [docs/11-infra-devops.md](../11-infra-devops.md)
- [docs/13-roadmap-estimativas.md](../13-roadmap-estimativas.md)
- [docs/17-seguranca-baseline.md](../17-seguranca-baseline.md)
- [ADR-0007 — Envelope encryption](./0007-criptografia-envelope-tenant.md)
