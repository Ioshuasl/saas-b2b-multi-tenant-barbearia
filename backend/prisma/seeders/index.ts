import { hash } from 'argon2';
import { getKeyManagement } from '../../src/shared/crypto/index.js';
import { idGenerator } from '../../src/shared/helpers/id_generator.js';
import { getTenantPrisma } from '../../src/shared/database/tenant_prisma.js';
import { AuditAction, writeAuditLog } from '../../src/shared/database/write_audit.js';
import { SEED } from './constants.js';

async function seedTenant(input: {
  tenantId: string;
  name: string;
  slug: string;
  locations: { id: string; slug: string; name: string; isDefault: boolean }[];
  users: {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'MANAGER';
    locationIds: string[];
  }[];
  passwordHash: string;
}): Promise<void> {
  const db = getTenantPrisma();
  const kms = getKeyManagement();

  await db.runProvisioning(async (tx) => {
    await tx.tenant.create({
      data: {
        id: input.tenantId,
        name: input.name,
        slug: input.slug,
        status: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
  });

  const ctx = {
    tenantId: input.tenantId,
    userId: input.users[0]?.id ?? input.tenantId,
    requestId: 'seed',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };

  await db.runInTenantContext(ctx, async (tx) => {
    for (const location of input.locations) {
      await tx.location.create({
        data: {
          id: location.id,
          tenantId: input.tenantId,
          slug: location.slug,
          name: location.name,
          isDefault: location.isDefault,
        },
      });
    }

    for (const user of input.users) {
      await tx.user.create({
        data: {
          id: user.id,
          tenantId: input.tenantId,
          email: user.email,
          passwordHash: input.passwordHash,
          name: user.name,
          role: user.role,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });
      for (const locationId of user.locationIds) {
        await tx.userLocation.create({
          data: {
            tenantId: input.tenantId,
            userId: user.id,
            locationId,
          },
        });
      }
    }

    const dek = kms.generateDek();
    const wrappedDek = await kms.wrapDek(dek);
    await tx.tenantCryptoKey.create({
      data: {
        id: idGenerator.next(),
        tenantId: input.tenantId,
        wrappedDek,
        status: 'ACTIVE',
      },
    });
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: input.users[0]?.id,
    action: AuditAction.SEED,
    resourceType: 'tenant',
    resourceId: input.tenantId,
    metadata: { slug: input.slug },
  });
}

async function main(): Promise<void> {
  const passwordHash = await hash(SEED.password);

  await seedTenant({
    tenantId: SEED.tenantA.id,
    name: SEED.tenantA.name,
    slug: SEED.tenantA.slug,
    passwordHash,
    locations: [{ ...SEED.locationA, isDefault: true }],
    users: [
      {
        ...SEED.userAOwner,
        role: 'OWNER',
        locationIds: [],
      },
    ],
  });

  await seedTenant({
    tenantId: SEED.tenantB.id,
    name: SEED.tenantB.name,
    slug: SEED.tenantB.slug,
    passwordHash,
    locations: [
      { ...SEED.locationBCentro, isDefault: true },
      { ...SEED.locationBJardim, isDefault: false },
    ],
    users: [
      { ...SEED.userBOwner, role: 'OWNER', locationIds: [] },
      {
        ...SEED.userBManager,
        role: 'MANAGER',
        locationIds: [SEED.locationBCentro.id],
      },
    ],
  });

  console.log('Seed S0 ok: Navalha (1 unidade) + Corte Fino (2 unidades).');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    const { getPrismaClient } = await import('../../src/shared/database/tenant_prisma.js');
    await getPrismaClient().$disconnect();
  });
