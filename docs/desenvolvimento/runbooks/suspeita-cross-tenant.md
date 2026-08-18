# Runbook — suspeita de vazamento cross-tenant (ou cross-unidade)

## Sintoma

Tenant A vê dado de B, ou gerente da unidade X vê Y. Incidente **S1**.

## Ação imediata

1. Não “consertar no banco” apagando evidência.
2. Isolar: feature flag / manutenção se o vetor ainda estiver aberto.
3. Coletar `requestId`, `tenantId`, `userId`, horário UTC, endpoint.
4. Reproduzir na suíte `pnpm test:rls` e `pnpm test:locations`.

## Hipóteses típicas

- Query sem `TenantPrisma` / sem `SET LOCAL`.
- Role com `BYPASSRLS`.
- Autorização de unidade só na UI.

## Comunicação

Avisar o dono da barbearia afetada depois de confirmar o fato — não especular no WhatsApp do cliente.
