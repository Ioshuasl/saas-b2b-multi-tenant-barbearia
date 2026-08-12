# ADR-0002 — Multi-tenancy com banco compartilhado e Row Level Security

- **Status:** Aceito
- **Data:** 2026-08-12

## Contexto

Cada barbearia (rede) é um tenant. Vazamento entre tenants é o pior incidente possível para este produto: destrói a confiança e expõe dados pessoais de clientes finais (nome, telefone, histórico de atendimentos).

Alternativas: banco por tenant, schema por tenant, ou tabelas compartilhadas com coluna `tenant_id`. E, no caso das tabelas compartilhadas, filtro na aplicação ou filtro no banco.

O ponto crítico: filtrar por `tenant_id` na aplicação depende de **todo** desenvolvedor, em **toda** query, para **sempre**. Isso não é um risco aceitável.

Além disso, o produto tem **unidades** (`location`) dentro do tenant. Isolamento entre unidades é de **autorização** (aplicação), não de RLS — para manter a policy trivial e rápida.

## Decisão

**Banco compartilhado + schema compartilhado + `tenant_id` em toda tabela operacional + PostgreSQL Row Level Security como mecanismo de isolamento entre tenants.**

1. Toda tabela de dado de tenant tem `tenant_id uuid NOT NULL` e políticas RLS para `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
2. As tabelas usam `ENABLE ROW LEVEL SECURITY` **e** `FORCE ROW LEVEL SECURITY`.
3. A aplicação conecta com uma role **sem** `BYPASSRLS` e **sem** ser dona das tabelas. Migrações usam `app_migrator`.
4. Todo acesso passa por uma transação que define o contexto via `set_config(..., true)` (`SET LOCAL`).
5. Sem contexto definido, a policy **não retorna nada** (falha fechada).
6. Índices sempre com `tenant_id` como primeira coluna.
7. Recurso de outro tenant responde `404`, não `403`.
8. Escopo de unidade (`location_id`) é validado na aplicação contra `user_locations`, com suíte de testes própria no CI.

## Consequências

**Positivas**

- Isolamento garantido pelo banco entre redes.
- Uma migração, um pool, um backup — viável para centenas de tenants.
- Onboarding de tenant é um `INSERT`, essencial para trial self-service.
- Multi-unidade no MVP sem complicar a RLS.

**Negativas / custos aceitos**

- Todo acesso ao banco precisa passar pelo wrapper `TenantPrisma`.
- Vazamento entre unidades do mesmo tenant exige disciplina e testes de autorização (RLS não cobre).
- Noisy neighbor: mitigado com rate limit por tenant e `statement_timeout`.

## Alternativas rejeitadas

**Banco por tenant / schema por tenant:** inviável para o ticket e o time do MVP.

**Filtro apenas na aplicação:** rejeitado — a segurança não pode depender de ninguém lembrar de um `WHERE`.

**RLS também por `location_id`:** rejeitado — policy complexa/lenta; autorização de unidade fica na aplicação.

## Verificação

- CI: nenhuma tabela com `tenant_id` sem RLS.
- Leitura cruzada entre tenants retorna vazio; `INSERT` divergente falha; consulta sem contexto retorna vazio.
- Suíte de escopo de unidade: gerente da unidade X recebe 404 em recurso da unidade Y.

## Referências

- [docs/06-multi-tenancy.md](../06-multi-tenancy.md)
- PostgreSQL: *Row Security Policies*
