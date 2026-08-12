# 06 — Multi-Tenancy

## 1. Decisão

**Banco único, schema único, isolamento por `tenant_id` com Row Level Security (RLS) do PostgreSQL.** Racional completo em [ADR-0002](./adr/0002-multi-tenancy-rls.md).

| Estratégia | Isolamento | Custo/manutenção | Migrações | Veredito |
| --- | --- | --- | --- | --- |
| Banco por tenant | Máximo | Alto (N bancos, N backups, N conexões) | Muito custoso | Rejeitado (só para enterprise futuro) |
| Schema por tenant | Alto | Médio-alto (migração em N schemas, pool inflado) | Custoso a partir de ~200 tenants | Rejeitado |
| **Linha compartilhada + RLS** | Alto (garantido pelo banco) | Baixo | Uma migração | **Escolhido** |
| Linha compartilhada sem RLS (só `WHERE`) | Frágil (um `WHERE` esquecido = vazamento) | Baixo | Uma migração | Rejeitado |

O ponto decisivo: com RLS, o isolamento **não depende de o desenvolvedor lembrar** de filtrar. Um bug de query vira "zero linhas", não "dados de outra barbearia".

## 2. Hierarquia de tenancy

```
Tenant (a rede/barbearia assinante)  ── assinatura, plano, limites, base de clientes
  └── Location (unidade/loja)        ── endereço, horários, equipe, agenda, página pública
  └── User (pertence a UM tenant no MVP) + user_locations (escopo de unidades)
  └── Dados operacionais (cliente, agenda, pagamento): sempre tenant_id; operacionais têm location_id
```

> **Dois níveis, um só de isolamento.** Somente o `tenant` é fronteira de **segurança** (RLS filtra por `tenant_id`). A `location` é fronteira **operacional e de autorização**, aplicada na aplicação via `user_locations`. Confundir os dois leva a RLS complexa e lenta.

- **Tenant** é a fronteira de segurança, de cobrança e de exportação de dados.
- **Location** é a fronteira operacional (agenda e caixa são por unidade). Rede com uma unidade só: unidade padrão criada no onboarding; a UI esconde o seletor enquanto houver apenas uma.
- **MVP:** um `User` pertence a um único tenant. Multi-membership (barbeiro em duas redes) fica para fase 2.

## 3. Resolução do tenant na requisição

Ordem de precedência:

1. **JWT** — o access token carrega `tenant_id` e `role`; é a fonte da verdade para rotas autenticadas. **`location_id` não vai no token** — o usuário troca de unidade sem reemitir JWT.
2. **Header `X-Location-Id`** (ou query) — unidade ativa; **sempre validada contra `user_locations`** (exceto `OWNER`, que vê a rede toda). Nunca é fonte de confiança sozinha.
3. **Slug no path** (`/{tenantSlug}` / `/{tenantSlug}/{locationSlug}`) — usado para rotas **públicas** (página de agendamento). Nunca é fonte de autorização do painel.

```ts
// shared/middlewares/tenant-context.middleware.ts
export function tenantContext(): RequestHandler {
  return (req, _res, next) => {
    const tenantId = req.auth.tenantId; // só do JWT
    const requestedLocationId = req.header('X-Location-Id');

    const allowedLocations = req.auth.role === 'OWNER'
      ? 'ALL'
      : req.auth.locationIds; // resolvido no login a partir de user_locations

    if (requestedLocationId && allowedLocations !== 'ALL'
        && !allowedLocations.includes(requestedLocationId)) {
      throw new ForbiddenError('location_not_allowed');
    }

    req.ctx = {
      tenantId: TenantId.create(tenantId),
      locationId: requestedLocationId ?? req.auth.defaultLocationId,
      locationScope: allowedLocations,
      userId: req.auth.userId,
      role: req.auth.role,
      requestId: req.id,
    };
    next();
  };
}
```

`req.ctx` é imutável e é a **única** origem de `tenantId` para toda a camada de aplicação. Nenhum use case aceita `tenantId` vindo do body.

## 4. Ativação da RLS por transação

```ts
// backend/src/shared/database/tenant-prisma.ts
export class TenantPrisma {
  constructor(private readonly prisma: PrismaClient) {}

  async runInTenantContext<T>(ctx: RequestContext, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // SET LOCAL vale só até o fim desta transação — seguro com pool de conexões
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${ctx.tenantId.value}, true)`;
      await tx.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId}, true)`;
      return fn(tx);
    });
  }
}
```

Pontos críticos:

- `set_config(..., true)` = `SET LOCAL`: escopo de transação. Com pooler (PgBouncer em *transaction mode*) isso continua correto; `SET` sem `LOCAL` **vazaria** para a próxima requisição que reusar a conexão — proibido.
- A aplicação conecta com um **role sem `BYPASSRLS`** (`app_user`). Migrações usam outro role (`app_migrator`) que é dono das tabelas.
- Toda operação de escrita passa por `runInTenantContext`. Jobs de fila reconstroem o contexto a partir do payload (`tenantId` obrigatório em todo job).
- Escopo de **unidade** NÃO entra na RLS — é filtro de aplicação (`location_id IN (...)`).

## 5. Políticas RLS

Padrão aplicado a **toda** tabela com dado de tenant:

```sql
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON customer
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

Helper para não repetir em dezenas de tabelas:

```sql
CREATE OR REPLACE FUNCTION platform.enable_tenant_rls(target regclass) RETURNS void AS $$
DECLARE
  t text := target::text;
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', t);
  EXECUTE format($f$CREATE POLICY tenant_isolation ON %s USING (tenant_id = current_setting('app.tenant_id', true)::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)$f$, t);
END;
$$ LANGUAGE plpgsql;
```

Como o Prisma não gerencia RLS, cada migração que cria tabela de tenant recebe um bloco SQL manual chamando `platform.enable_tenant_rls('nova_tabela')`. Um teste de arquitetura falha o CI se existir tabela com coluna `tenant_id` sem policy.

## 6. Tabelas globais (sem `tenant_id`)

| Tabela | Conteúdo | RLS |
| --- | --- | --- |
| `tenant` | Tenants | Policy própria: linha visível se `id = app.tenant_id` (ou role de plataforma) |
| `user` | Identidade no tenant (e-mail, senha) | No MVP o user tem `tenant_id`; se no futuro houver user global multi-rede, esta tabela sai da RLS de tenant |
| `plan` | Catálogo de planos do SaaS | Leitura pública autenticada |
| `service_catalog_template` | Serviços padrão (semente do onboarding) | Leitura pública autenticada |
| `outbox_event` | Eventos de domínio | RLS por `tenant_id` (dispatcher usa role próprio com bypass controlado) |
| `platform_admin` | Operadores da plataforma | Sem `tenant_id`; fora da RLS de tenant |
| `platform_audit_log` | Auditoria de suporte (break-glass) | Somente role de plataforma |
| `webhook_events` | Idempotência de webhooks de pagamento | Sem tenant (evento do provedor) |

## 7. Índices e desempenho em ambiente compartilhado

Regras:

1. **`tenant_id` é a primeira coluna de todo índice composto.**
2. Chave primária permanece `id` (UUID v7), buscas usam `(tenant_id, …)`.
3. Unicidade de negócio é sempre por tenant: `UNIQUE (tenant_id, phone)`, `UNIQUE (tenant_id, slug)`.

```sql
CREATE INDEX idx_customer_tenant_phone     ON customer (tenant_id, phone);
CREATE UNIQUE INDEX uq_customer_tenant_phone ON customer (tenant_id, phone);
CREATE INDEX idx_appointment_tenant_loc    ON appointment (tenant_id, location_id, starts_at);
CREATE INDEX idx_appointment_tenant_staff  ON appointment (tenant_id, staff_id, starts_at);
```

Prevenção de overbooking no banco (profissional não pode estar em duas unidades ao mesmo tempo — a constraint **não** inclui `location_id`):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointment
  ADD COLUMN period tstzrange
  GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED;

ALTER TABLE appointment ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    tenant_id WITH =,
    staff_id  WITH =,
    period WITH &&
  ) WHERE (status IN ('SCHEDULED', 'CONFIRMED', 'IN_SERVICE'));
```

A aplicação traduz o erro `23P01` para `409 SLOT_TAKEN`.

### "Tenants gordos" (noisy neighbor)

- Todo endpoint de lista é paginado com limite máximo (100) e cursor.
- Rate limit por tenant e por IP na API pública.
- Relatórios pesados vão para fila quando passam de um limite de linhas.
- Monitoramos p95 por tenant.

## 8. Provisionamento e ciclo de vida do tenant

```
signup → CreateTenantService (transação única):
  1. cria tenant (status TRIALING, trial_ends_at = now + 14d)
  2. cria location padrão (is_default) com timezone
  3. cria user (Argon2id) + role OWNER
  4. copia catálogo padrão de serviços para o tenant
  5. cria horários de funcionamento padrão (seg–sáb 09:00–19:00) na unidade
  6. registra consentimento de termos de uso (versão)
  7. emite evento tenant.created (onboarding por e-mail, telemetria)
```

Estados do tenant (alinhados ao billing): `TRIALING → ACTIVE → PAST_DUE → NEGOTIATING → SUSPENDED → CANCELED`, com purge após retenção.

- `PAST_DUE` / `NEGOTIATING`: página pública e painel **ativos**; prazo negociado em `grace_until` (ver pesquisa de billing).
- `SUSPENDED`: página pública desativada; painel só pagamento + exportação.
- `CANCELED`: 90 dias de retenção para exportação; depois eliminação/anonimização ([10 — LGPD](./10-seguranca-lgpd-compliance.md)).

## 9. Acesso de suporte da plataforma (break-glass)

1. Suporte não tem acesso a dado de tenant por padrão.
2. Acesso exige motivo + validade curta; no MVP impersonation é **somente leitura**.
3. O acesso assume `app.tenant_id` explicitamente e grava em `platform_audit_log` / `audit_logs`.
4. Banner visível na UI durante impersonation.

## 10. Testes obrigatórios de isolamento

| Teste | Expectativa |
| --- | --- |
| Consultar entidade do tenant B com contexto do tenant A | 0 linhas / 404 |
| `INSERT` com `tenant_id` diferente do contexto | erro de policy (`WITH CHECK`) |
| Executar caso de uso sem `app.tenant_id` definido | erro, nunca "todas as linhas" |
| `UPDATE` cruzando tenant via ID direto | 0 linhas afetadas |
| Job de fila sem `tenantId` no payload | falha na validação do job |
| Toda tabela com `tenant_id` possui RLS habilitada | consulta de metadados retorna 0 |
| Conexão da aplicação não tem `BYPASSRLS` | `pg_roles` confirma |
| Usuário com escopo só da unidade X acessa recurso da unidade Y | 404 (teste de **autorização**, não RLS) |

Esses testes rodam contra Postgres real (Testcontainers) em cada PR. Isolamento sem teste automatizado é isolamento imaginário.
