# 04 — Arquitetura e Multi-Tenancy

## Decisão central: estratégia de isolamento

| Estratégia | Isolamento | Custo/tenant | Operação | Veredito |
|---|---|---|---|---|
| Banco por tenant | Máximo | Alto | Migração em N bancos, pool de conexões explode | ❌ inviável no ticket alvo |
| Schema por tenant | Alto | Médio | Migrações lentas acima de ~500 schemas | ❌ para depois, se enterprise pedir |
| **Tabela compartilhada + `tenant_id` + RLS** | Bom (garantido pelo banco) | Baixo | Uma migração para todos | ✅ **escolhida** |

> **Dois níveis, um só de isolamento.** O produto tem `tenant` (a rede) e `location` (a unidade). **Somente o `tenant` é fronteira de segurança** — RLS filtra por `tenant_id`. A `location` é fronteira **operacional e de autorização**, aplicada na camada de aplicação via `user_locations`. Confundir os dois leva a RLS complexa e lenta; separar mantém a policy trivial. Ver [05](05-modelo-de-dados.md).

**ADR-001:** banco PostgreSQL único, schema único, coluna `tenant_id UUID NOT NULL` em **todas** as tabelas de negócio, com **Row Level Security** ativa. A aplicação define `SET LOCAL app.tenant_id = '<uuid>'` no início de cada transação; as policies filtram tudo. Isso torna o isolamento independente de o desenvolvedor lembrar do `WHERE tenant_id = ?`.

Migração futura para schema/banco dedicado é possível por tenant, sem mudar o modelo de dados (o `tenant_id` continua válido).

```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON appointments
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

O usuário de aplicação **não** pode ser owner das tabelas nem ter `BYPASSRLS`. Migrações rodam com um usuário separado.

## Resolução do tenant (como saber de quem é a requisição)

Três origens, nesta ordem:

1. **Painel autenticado:** `tenant_id` vem do **JWT**, nunca de header ou body enviado pelo cliente. Um usuário pertence a um tenant (multi-tenant por usuário fica para fase 2, via tabela `memberships`). A **unidade ativa** vem de um parâmetro de request (`X-Location-Id` ou query), mas é **sempre validada contra `user_locations`** antes de qualquer query — parâmetro de conveniência, nunca de confiança.
2. **Página pública:** o path resolve tenant e unidade: `/{tenant_slug}` (seletor de unidades ou redirect quando há só uma) e `/{tenant_slug}/{location_slug}` (agendamento). Só endpoints da API pública aceitam essa origem, e eles são read-mostly + criação de agendamento.
3. **Back-office da plataforma:** token com claim `platform_admin`; para acessar dados de um tenant, precisa emitir um token de impersonation com `tenant_id` explícito, registrado em `audit_log`.

Middleware obrigatório: toda request autenticada abre transação e executa `SET LOCAL app.tenant_id`. Requests sem tenant resolvido só podem atingir rotas explicitamente marcadas como tenant-less (login, signup, webhooks, health).

## Camadas

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend — Next.js + React + TypeScript                     │
│  · app.dominio.com              → painel (auth)              │
│  · dominio.com/{tenant}         → seletor de unidades (SSR)  │
│  · dominio.com/{tenant}/{unid.} → agendamento público (SSR)  │
│  · admin.dominio.com            → back-office da plataforma  │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS / JSON
┌───────────────▼──────────────────────────────────────────────┐
│  API — Node + TypeScript + Express + Sequelize (mod. modular)│
│  middleware: auth → tenant → SET LOCAL → escopo de unidade   │
│  módulos: iam · catalog · scheduling · customers · billing   │
│           notifications · reporting · platform-admin         │
└───┬───────────────┬──────────────────┬───────────────────────┘
    │               │                  │
┌───▼─────┐   ┌─────▼──────┐    ┌──────▼───────────────┐
│Postgres │   │Redis        │    │Worker (fila)         │
│(RLS)    │   │cache/lock   │    │lembretes, e-mail,    │
│         │   │             │    │webhooks, relatórios  │
└─────────┘   └─────────────┘    └──────────────────────┘
```

### Aplicando RLS com Sequelize

Sequelize não tem suporte nativo a RLS. O padrão obrigatório é encapsular **toda** request em uma transação que primeiro define o tenant — e proibir, via hook global, qualquer query fora dela:

```ts
export async function withTenant<T>(tenantId: string, fn: (t: Transaction) => Promise<T>) {
  return sequelize.transaction(async (t) => {
    await sequelize.query('SET LOCAL app.tenant_id = :tenantId', {
      replacements: { tenantId }, transaction: t,
    });
    return fn(t);
  });
}
```

Usar `AsyncLocalStorage` para carregar a transação do request e um hook `beforeFind`/`beforeSave` global que **lança erro** se não houver transação com tenant no contexto. Assim o esquecimento do dev vira erro de runtime em dev/CI, não vazamento em produção.

**ADR-002 — monolito modular, não microsserviços.** Time pequeno, domínio único, transações que cruzam módulos (agendamento + cliente + notificação). Módulos com fronteiras explícitas (cada um expõe um serviço; sem import cruzado de repositórios) permitem extrair depois se necessário.

## O motor de agendamento (parte mais difícil)

### Cálculo de slots disponíveis
Entrada: `tenant`, **`location`**, `serviço(s)` (duração total D), `profissional` (ou "qualquer"), intervalo de datas. Horário de funcionamento, bloqueios e timezone são da unidade.

```
para cada dia do intervalo:
  janelas = horario_da_unidade(dia) ∩ jornada_do_profissional_na_unidade(dia)
  janelas = janelas − bloqueios(dia) − agendamentos_do_profissional(dia, TODAS as unidades)
  para cada janela w:
    gerar slots de início a cada STEP (ex.: 15min)
      onde [inicio, inicio+D] ⊆ w
      e inicio ≥ agora + antecedencia_minima
```

Cuidados:
- **Fuso horário:** armazenar tudo em `timestamptz` (UTC); **cada unidade** tem `timezone` (IANA) — uma rede pode ter lojas em fusos diferentes. Horário de funcionamento é *local*; conversão sempre via timezone da unidade, nunca do servidor.
- **Profissional que roda entre unidades:** os agendamentos dele em qualquer unidade bloqueiam a agenda — a subtração de agendamentos ignora `location_id` de propósito.
- **DST e virada de dia:** testar explicitamente as datas de mudança de horário de verão (caso o país volte a tê-lo) e agendamentos que cruzam a meia-noite.
- **Performance:** cachear a grade por (tenant, unidade, profissional, dia) em Redis com TTL curto e invalidar em qualquer escrita que afete o dia.
- **Buffer:** campo opcional de intervalo entre atendimentos por serviço.

### Prevenção de overbooking
Não confiar em "consulta e depois insere". Usar constraint do banco:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE appointments ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    tenant_id WITH =,
    staff_id  WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status IN ('AGENDADO','CONFIRMADO','EM_ATENDIMENTO'));
```

Violação → a API traduz para `409 SLOT_TAKEN`. Isso cobre duas abas do painel, concorrência entre painel e página pública e — por **não** incluir `location_id` na constraint — o mesmo barbeiro agendado ao mesmo tempo em duas unidades.

## Escalabilidade e ruído entre tenants

- API stateless, escala horizontal atrás de load balancer.
- Rate limit **por tenant** e por IP na API pública (evita que um tenant grande ou um bot derrube os demais).
- Fila de jobs com chave de partição por tenant; um tenant com 10k lembretes não pode travar a fila dos outros (usar filas separadas por prioridade ou concorrência limitada por tenant).
- Todo log/trace/métrica carrega `tenant_id` como atributo.
- Índices sempre com `tenant_id` como primeira coluna: `(tenant_id, location_id, starts_at)`, `(tenant_id, staff_id, starts_at)`.
- Cache de disponibilidade com chave `(tenant, location, staff, dia)`.

## Ambientes de execução do frontend

- **Painel** e **página pública** podem ser o mesmo app com layouts distintos; separar rotas por prefixo evita carregar bundle de painel para o cliente final. O bundle da página pública deve ser mínimo (é a página com mais tráfego e pior rede).
