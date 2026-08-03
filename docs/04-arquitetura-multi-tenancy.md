# 04 — Arquitetura e Multi-Tenancy

## Decisão central: estratégia de isolamento

| Estratégia | Isolamento | Custo/tenant | Operação | Veredito |
|---|---|---|---|---|
| Banco por tenant | Máximo | Alto | Migração em N bancos, pool de conexões explode | ❌ inviável no ticket alvo |
| Schema por tenant | Alto | Médio | Migrações lentas acima de ~500 schemas | ❌ para depois, se enterprise pedir |
| **Tabela compartilhada + `tenant_id` + RLS** | Bom (garantido pelo banco) | Baixo | Uma migração para todos | ✅ **escolhida** |

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

1. **Painel autenticado:** `tenant_id` vem do **JWT**, nunca de header ou body enviado pelo cliente. Um usuário pertence a um tenant (multi-tenant por usuário fica para fase 2, via tabela `memberships`).
2. **Página pública:** o `slug` do path (`/{slug}`) resolve o tenant; só endpoints da API pública (`/api/public/{slug}/...`) aceitam essa origem, e eles são read-mostly + criação de agendamento.
3. **Back-office da plataforma:** token com claim `platform_admin`; para acessar dados de um tenant, precisa emitir um token de impersonation com `tenant_id` explícito, registrado em `audit_log`.

Middleware obrigatório: toda request autenticada abre transação e executa `SET LOCAL app.tenant_id`. Requests sem tenant resolvido só podem atingir rotas explicitamente marcadas como tenant-less (login, signup, webhooks, health).

## Camadas

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend (SPA/SSR)                                          │
│  · app.dominio.com        → painel (auth)                    │
│  · dominio.com/{slug}     → página pública de agendamento    │
│  · admin.dominio.com      → back-office da plataforma        │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS / JSON
┌───────────────▼──────────────────────────────────────────────┐
│  API (monolito modular)                                      │
│  middleware: auth → resolve tenant → SET LOCAL → handler     │
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

**ADR-002 — monolito modular, não microsserviços.** Time pequeno, domínio único, transações que cruzam módulos (agendamento + cliente + notificação). Módulos com fronteiras explícitas (cada um expõe um serviço; sem import cruzado de repositórios) permitem extrair depois se necessário.

## O motor de agendamento (parte mais difícil)

### Cálculo de slots disponíveis
Entrada: `tenant`, `serviço(s)` (duração total D), `profissional` (ou "qualquer"), intervalo de datas.

```
para cada dia do intervalo:
  janelas = horario_funcionamento(dia) ∩ jornada_do_profissional(dia)
  janelas = janelas − bloqueios(dia) − agendamentos_ativos(dia)
  para cada janela w:
    gerar slots de início a cada STEP (ex.: 15min)
      onde [inicio, inicio+D] ⊆ w
      e inicio ≥ agora + antecedencia_minima
```

Cuidados:
- **Fuso horário:** armazenar tudo em `timestamptz` (UTC); cada tenant tem `timezone` (IANA, ex.: `America/Sao_Paulo`). Horário de funcionamento é *local*; conversão sempre via timezone do tenant. Testar virada de horário e datas de DST.
- **Performance:** cachear a grade por (tenant, profissional, dia) em Redis com TTL curto e invalidar em qualquer escrita que afete o dia.
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

Violação → a API traduz para `409 SLOT_TAKEN`. Isso cobre também o caso de duas abas do painel e concorrência entre painel e página pública.

## Escalabilidade e ruído entre tenants

- API stateless, escala horizontal atrás de load balancer.
- Rate limit **por tenant** e por IP na API pública (evita que um tenant grande ou um bot derrube os demais).
- Fila de jobs com chave de partição por tenant; um tenant com 10k lembretes não pode travar a fila dos outros (usar filas separadas por prioridade ou concorrência limitada por tenant).
- Todo log/trace/métrica carrega `tenant_id` como atributo.
- Índices sempre com `tenant_id` como primeira coluna: `(tenant_id, starts_at)`, `(tenant_id, staff_id, starts_at)`.

## Ambientes de execução do frontend

- **Painel** e **página pública** podem ser o mesmo app com layouts distintos; separar rotas por prefixo evita carregar bundle de painel para o cliente final. O bundle da página pública deve ser mínimo (é a página com mais tráfego e pior rede).
