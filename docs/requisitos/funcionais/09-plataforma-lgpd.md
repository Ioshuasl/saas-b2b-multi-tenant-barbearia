# RF — Plataforma, Auditoria e LGPD (E9)

**Módulos:** `platform` / capacidades em `shared/` · **Detalhe:** [modulos/09-plataforma.md](../../modulos/09-plataforma.md), [10 — Segurança/LGPD](../../10-seguranca-lgpd-compliance.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E9-01 | Isolamento multi-tenant via RLS em toda tabela operacional com `tenant_id` | Must | US-08, ADR-0002 |
| RF-E9-02 | Acesso a recurso de outro tenant responde `404` (não revela existência) | Must | US-08, doc 06 |
| RF-E9-03 | Isolamento entre unidades do mesmo tenant via autorização (`user_locations`); suíte no CI | Must | US-07, US-08, doc 06/10 |
| RF-E9-04 | Trilha de auditoria de acessos e alterações sensíveis (impersonation, billing, permissões, exclusão LGPD) | Must | doc 10 |
| RF-E9-05 | Back-office lista tenants, status de assinatura, MRR e fila de cobrança | Must | E9 escopo |
| RF-E9-06 | Impersonation: só `platform_admin`, motivo obrigatório, TTL curto, **somente leitura** no MVP, banner na UI, audit log | Must | doc 10 |
| RF-E9-07 | Suporte não tem acesso a dado de tenant por padrão | Must | doc 06 |
| RF-E9-08 | Exportação de dados do tenant (CSV/pacote) sob demanda para `OWNER` | Must | doc 10, direitos do titular |
| RF-E9-09 | Anonimização de cliente sob solicitação LGPD (nome genérico; telefone/e-mail null; agenda preservada) | Must | doc 10 |
| RF-E9-10 | API expõe `/health` (liveness) e `/ready` (dependências) | Must | doc 11 |
| RF-E9-11 | Logs estruturados JSON com `requestId`, `tenantId`, `locationId`, `userId`, sem PII desnecessária | Must | doc 11, RNF-OBS |
| RF-E9-12 | Eventos de domínio em outbox na mesma transação; entrega at-least-once | Must | doc 05, ADR-0006 (Parte 4) |
| RF-E9-13 | API pública versionada em `/api/v1` com envelope de erro estável | Must | ADR-0003, doc 08 |
| RF-E9-14 | Rotas públicas (booking) com rate limit agressivo | Must | doc 08/10 |
| RF-E9-15 | Feature flags por tenant/plano | Should | pesquisa billing |
| RF-E9-16 | Barbearia = controladora; plataforma = operadora — refletido em Termos/DPA antes do primeiro pagante | Must | doc 10 |
| RF-E9-17 | Tenant cancelado: retenção 90 dias para exportação; depois purge/anonimização | Must | doc 10 |
| RF-E9-18 | Teste CI falha se tabela de negócio não tiver `tenant_id` + policy RLS | Must | US-08, doc 06 |

## Critérios de aceite transversais (E9)

- Suíte de isolamento tenant **e** unidade verde no CI.
- Exportação de um tenant não contém dados de outro.
- Impersonation sem motivo é recusada; escrita via impersonation bloqueada no MVP.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E9-19 | Impersonation com escrita controlada | Could (fase 2) |
| RF-E9-20 | API pública para terceiros / webhooks de saída | Could (fase 3) |
| RF-E9-21 | SSO corporativo | Could (fase 3) |
| RF-E9-22 | Importador de dados de concorrentes | Could (fase 2) |
