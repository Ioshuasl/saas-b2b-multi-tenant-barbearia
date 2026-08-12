# ADR-0004 — Prisma como ORM, com repositórios e SQL onde necessário

- **Status:** Aceito
- **Data:** 2026-08-12

## Contexto

O backend é Node.js + TypeScript e o banco é PostgreSQL. Precisamos de acesso a dados tipado, migrações versionadas e suporte a recursos específicos do Postgres: Row Level Security, constraints de exclusão com `tstzrange` (anti-overbooking), índices parciais, views de relatório.

A documentação anterior da barbearia apontava Sequelize; esta ADR **substitui oficialmente** essa escolha por Prisma (alinhado ao prontuário odontológico e à decisão A do alinhamento documental).

Candidatos: Prisma, Drizzle, TypeORM, Kysely, Sequelize e `pg` puro.

## Decisão

**Prisma** como ORM principal, com três regras que limitam seu alcance:

1. Prisma existe **apenas** em `modules/<dominio>/repositories/` e em `shared/database/`. Nenhum tipo gerado pelo Prisma cruza para `models/` ou `services/`. Um arquivo por operação, classe curta (`CreateRepository`, `ListRepository`) — ver [doc 16](../16-estrutura-de-pastas.md).
2. Todo acesso passa pelo wrapper `TenantPrisma` (contexto de tenant por transação, ADR-0002). Uso direto do `PrismaClient` fora do wrapper é erro de lint.
3. O que o Prisma não expressa bem é escrito em **SQL** dentro de migrações ou em `$queryRaw` parametrizado: RLS/policies, `EXCLUDE USING gist`, índices parciais, views e consultas de disponibilidade/relatório.

Migrações: `prisma migrate` com SQL editado à mão quando necessário, executadas com a role `app_migrator`.

## Consequências

**Positivas**

- Tipagem excelente; migrações versionadas e editáveis; `$transaction` com callback encaixa no `set_config` de RLS; produtividade em CRUD.

**Negativas / custos aceitos**

- Prisma não modela RLS nem `EXCLUDE` no schema — SQL manual + testes de CI.
- Relatórios ficam melhores em `$queryRaw`.
- Risco de acoplamento se tipos do Prisma vazarem para o domínio — mitigado por lint.

## Alternativas rejeitadas

**Sequelize:** rejeitado nesta revisão — tipagem e DX inferiores ao Prisma para o padrão Orius + DDD adotado; documentação legado que citava Sequelize fica obsoleta.

**Drizzle:** alternativa forte; maturidade/ecossistema de migração menos consolidado no momento da decisão.

**TypeORM / Kysely / SQL puro:** rejeitados pelos mesmos motivos do prontuário odontológico (custo de manutenção vs. ganho).

## Padrão de repositório adotado

```ts
// modules/scheduling/repositories/appointment/appointment_create.repository.ts
export class CreateRepository {
  constructor(private readonly db: TenantPrisma) {}

  async execute(ctx: RequestContext, appointment: Appointment): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      const data = AppointmentMapper.toPersistence(appointment);
      try {
        await tx.appointment.create({ data });
      } catch (error) {
        if (isPgError(error, '23P01')) throw new SlotTakenError(appointment.slot);
        throw error;
      }
    });
  }
}
```

## Verificação

- Lint: `@prisma/client` importável apenas em `repositories/` e `shared/database/`.
- Teste de integração para constraints e mapeamento.
- Teste de RLS em toda tabela com `tenant_id`.

## Referências

- [docs/07-modelo-de-dados.md](../07-modelo-de-dados.md) (será reescrito em parte posterior)
- [ADR-0002](./0002-multi-tenancy-rls.md)
