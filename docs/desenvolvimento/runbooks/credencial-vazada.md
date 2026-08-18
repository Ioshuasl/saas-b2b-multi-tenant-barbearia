# Runbook — credencial vazada

## Sintoma

Segredo em git, log, ticket ou captura de tela (JWT, `DATABASE_URL`, `TENANT_KEK`, `WAHA_API_KEY`, S3).

## Ação imediata

1. Rotacionar o segredo (gerar novo; invalidar o antigo).
2. Se foi commitado: considerar o valor comprometido mesmo após `git rm`.
3. Revogar sessões se for chave JWT (`kid` novo; manter a antiga só o tempo do drain).
4. Registrar em `audit_log` / incidente interno (sem colar o segredo).

## Depois

- Confirmar gitleaks no CI.
- Revisar quem teve acesso ao dump/log.
