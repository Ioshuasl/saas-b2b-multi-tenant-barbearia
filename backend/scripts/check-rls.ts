import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { TenantPrisma } from '../src/shared/database/tenant_prisma.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

function ctxOf(tenantId: string) {
  return {
    tenantId,
    userId: randomUUID(),
    requestId: randomUUID(),
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL obrigatório');
  if (url.includes('postgres:postgres') || url.includes('app_migrator')) {
    console.warn(
      'Aviso: DATABASE_URL parece superuser/migrator — RLS pode ser bypassada. Use app_user.',
    );
  }

  const prisma = new PrismaClient();
  const tenantDb = new TenantPrisma(prisma);

  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const locA = randomUUID();
  const locB = randomUUID();
  const userA = randomUUID();

  await tenantDb.runProvisioning(async (tx) => {
    await tx.tenant.create({
      data: { id: tenantA, name: 'Barbearia A', slug: `a-${tenantA.slice(0, 8)}` },
    });
    await tx.tenant.create({
      data: { id: tenantB, name: 'Barbearia B', slug: `b-${tenantB.slice(0, 8)}` },
    });
  });

  const ctxA = ctxOf(tenantA);
  const ctxB = ctxOf(tenantB);

  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.location.create({
      data: {
        id: locA,
        tenantId: tenantA,
        slug: 'default',
        name: 'Loja A',
        isDefault: true,
      },
    });
    await tx.user.create({
      data: {
        id: userA,
        tenantId: tenantA,
        email: `a-${userA.slice(0, 8)}@teste.local`,
        passwordHash: 'x',
        name: 'Owner A',
        role: 'OWNER',
      },
    });
    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA,
        actorType: 'SYSTEM',
        action: 'CREATE',
        resourceType: 'tenant',
        resourceId: tenantA,
      },
    });
  });

  await tenantDb.runInTenantContext(ctxB, async (tx) => {
    await tx.location.create({
      data: {
        id: locB,
        tenantId: tenantB,
        slug: 'default',
        name: 'Loja B',
        isDefault: true,
      },
    });
  });

  const locVisibleA = await tenantDb.runInTenantContext(ctxA, (tx) =>
    tx.location.findUnique({ where: { id: locB } }),
  );
  const locOwnA = await tenantDb.runInTenantContext(ctxA, (tx) =>
    tx.location.findUnique({ where: { id: locA } }),
  );
  const userVisibleB = await tenantDb.runInTenantContext(ctxB, (tx) =>
    tx.user.findUnique({ where: { id: userA } }),
  );
  const withoutCtx = await prisma.location.findMany();
  const auditA = await tenantDb.runInTenantContext(ctxA, (tx) => tx.auditLog.findMany());
  const auditB = await tenantDb.runInTenantContext(ctxB, (tx) => tx.auditLog.findMany());

  const tablesWithoutRls = await prisma.$queryRaw<{ relname: string }[]>`
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN information_schema.columns col
      ON col.table_schema = 'public' AND col.table_name = c.relname AND col.column_name = 'tenant_id'
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  `;

  let failed = false;

  if (locOwnA === null) {
    console.error('FAIL: tenant A deveria ver a própria location');
    failed = true;
  }
  if (locVisibleA !== null) {
    console.error('FAIL: tenant A não deveria ver location do tenant B');
    failed = true;
  }
  if (userVisibleB !== null) {
    console.error('FAIL: tenant B não deveria ver user do tenant A');
    failed = true;
  }
  if (withoutCtx.length !== 0) {
    console.error('FAIL: sem contexto deveria ver 0 locations; viu', withoutCtx.length);
    failed = true;
  }
  if (auditA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 audit_log, viu', auditA.length);
    failed = true;
  }
  if (auditB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 audit_log, viu', auditB.length);
    failed = true;
  }
  if (tablesWithoutRls.length !== 0) {
    console.error(
      'FAIL: tabelas com tenant_id sem RLS:',
      tablesWithoutRls.map((t) => t.relname).join(', '),
    );
    failed = true;
  }

  try {
    await tenantDb.runInTenantContext(ctxA, async (tx) => {
      await tx.location.create({
        data: {
          id: randomUUID(),
          tenantId: tenantB,
          slug: 'invasao',
          name: 'Invasão',
        },
      });
    });
    console.error('FAIL: INSERT cross-tenant deveria falhar');
    failed = true;
  } catch {
    // esperado
  }

  await prisma.$disconnect();

  if (failed) {
    process.exit(1);
  }
  console.log('OK: RLS isolation checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
