# Módulo — Plataforma (`platform` / `shared/`)

## 1. Responsabilidade

Capacidades transversais: contexto de tenant, RLS helpers, outbox, auditoria, exportação/LGPD, feature flags, health, back-office e envelope crypto (port). Não é bounded context de negócio — vive em `backend/src/shared/` + rotas `platform/*`.

## 2. Peças

| Peça | Papel |
| --- | --- |
| `TenantPrisma` | `SET LOCAL app.tenant_id` por transação |
| `outbox_event` | Evento na mesma TX do agregado; worker at-least-once |
| `audit_log` | Append-only; impersonation, billing, permissões, LGPD |
| `platform_audit_log` | Ações de `platform_admin` |
| `tenant_crypto_key` | DEK wrapped; `KeyManagementPort` |
| `data_subject_request` | ACCESS / correção / exclusão / portabilidade |
| Feature flags | Por tenant/plano (`plan_feature`), não `if` espalhado |
| `/health` `/ready` | Liveness vs Postgres/Redis/S3 |

## 3. Back-office

- Lista de tenants: status, trial, MRR estimado, dias em atraso.
- Fila “a cobrar”: `PAST_DUE` / `NEGOTIATING`, botão `grace_until` + motivo.
- Impersonation: MFA, motivo, TTL, **somente leitura**, banner, audit.
- Suporte **sem** acesso default a dado de tenant.

## 4. LGPD

Barbearia = controladora; plataforma = operadora (DPA antes do primeiro pagante). Exportação do tenant (`OWNER`) e do titular. Anonimização de customer preserva linhas de agenda. Purge 90 dias após `CANCELED` / `SUSPENDED` longo.

## 5. Eventos / jobs típicos

`identity.tenant_created` → e-mail de boas-vindas, telemetria.
Dispatcher do outbox → filas BullMQ (`send-whatsapp-message`, `send-email`, `export-report`).
Jobs: trial expiry, reconciliação **não** contra gateway no MVP (só estados locais).

## 6. Contratos

```ts
export interface PlatformModuleApi {
  recordAudit(input: AuditInput): Promise<void>;
  publishOutbox(tx: Tx, event: DomainEvent): Promise<void>;
  encryptField(ctx: RequestContext, ref: FieldRef, plaintext: string): Promise<string>;
  decryptField(ctx: RequestContext, ref: FieldRef, ciphertext: string): Promise<string>;
}
```

Detalhe normativo: [10](../10-seguranca-lgpd-compliance.md), [17](../17-seguranca-baseline.md), [ADR-0006](../adr/0006-filas-bullmq.md), [ADR-0007](../adr/0007-criptografia-envelope-tenant.md).
