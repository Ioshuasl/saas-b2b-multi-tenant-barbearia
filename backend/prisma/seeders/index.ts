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
  let skipped = false;

  await db.runProvisioning(async (tx) => {
    const existing = await tx.tenant.findUnique({ where: { id: input.tenantId } });
    if (existing) {
      skipped = true;
      return;
    }
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

  if (skipped) {
    console.log(`Seed ${input.slug} já existe — pulando criação do tenant.`);
    return;
  }

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

    const services = [
      { name: 'Corte', durationMinutes: 40, sortOrder: 1 },
      { name: 'Barba', durationMinutes: 20, sortOrder: 2 },
      { name: 'Corte + barba', durationMinutes: 50, sortOrder: 3 },
    ];
    for (const service of services) {
      await tx.service.create({
        data: {
          id: idGenerator.next(),
          tenantId: input.tenantId,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceCents: 0n,
          sortOrder: service.sortOrder,
        },
      });
    }

    const startsAt = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
    const endsAt = new Date(Date.UTC(1970, 0, 1, 19, 0, 0));
    for (const location of input.locations) {
      for (const weekday of [1, 2, 3, 4, 5, 6]) {
        await tx.businessHours.create({
          data: {
            id: idGenerator.next(),
            tenantId: input.tenantId,
            locationId: location.id,
            weekday,
            startsAt,
            endsAt,
          },
        });
      }
    }
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

function tenantCtx(tenantId: string, userId: string) {
  return {
    tenantId,
    userId,
    requestId: 'seed-panel',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
}

async function ensureStaff(input: {
  tenantId: string;
  userId: string;
  staffId: string;
  name: string;
  homeLocationId: string;
  linkedUserId?: string;
}): Promise<void> {
  const db = getTenantPrisma();
  await db.runInTenantContext(tenantCtx(input.tenantId, input.userId), async (tx) => {
    const existing = await tx.staff.findUnique({ where: { id: input.staffId } });
    if (!existing) {
      await tx.staff.create({
        data: {
          id: input.staffId,
          tenantId: input.tenantId,
          homeLocationId: input.homeLocationId,
          userId: input.linkedUserId,
          name: input.name,
          commissionPercent: 0,
          acceptsOnlineBooking: true,
          active: true,
        },
      });
    } else if (input.linkedUserId && existing.userId !== input.linkedUserId) {
      await tx.staff.update({
        where: { id: input.staffId },
        data: { userId: input.linkedUserId },
      });
    }

    const link = await tx.staffLocation.findUnique({
      where: {
        tenantId_staffId_locationId: {
          tenantId: input.tenantId,
          staffId: input.staffId,
          locationId: input.homeLocationId,
        },
      },
    });
    if (!link) {
      await tx.staffLocation.create({
        data: {
          tenantId: input.tenantId,
          staffId: input.staffId,
          locationId: input.homeLocationId,
        },
      });
    }
  });
}

async function ensureStaffUser(passwordHash: string): Promise<string> {
  const db = getTenantPrisma();
  return db.runInTenantContext(tenantCtx(SEED.tenantB.id, SEED.userBOwner.id), async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: SEED.userBStaff.email } });
    if (!existing) {
      await tx.user.create({
        data: {
          id: SEED.userBStaff.id,
          tenantId: SEED.tenantB.id,
          email: SEED.userBStaff.email,
          passwordHash,
          name: SEED.userBStaff.name,
          role: 'STAFF',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });
    }
    const userId = existing?.id ?? SEED.userBStaff.id;
    const locationLink = await tx.userLocation.findUnique({
      where: {
        tenantId_userId_locationId: {
          tenantId: SEED.tenantB.id,
          userId,
          locationId: SEED.locationBCentro.id,
        },
      },
    });
    if (!locationLink) {
      await tx.userLocation.create({
        data: {
          tenantId: SEED.tenantB.id,
          userId,
          locationId: SEED.locationBCentro.id,
        },
      });
    }
    return userId;
  });
}

async function ensurePanelFixtures(passwordHash: string): Promise<void> {
  await ensureStaff({
    tenantId: SEED.tenantA.id,
    userId: SEED.userAOwner.id,
    staffId: SEED.staffA.id,
    name: SEED.staffA.name,
    homeLocationId: SEED.locationA.id,
  });

  const staffUserId = await ensureStaffUser(passwordHash);

  await ensureStaff({
    tenantId: SEED.tenantB.id,
    userId: SEED.userBOwner.id,
    staffId: SEED.staffBCentro.id,
    name: SEED.staffBCentro.name,
    homeLocationId: SEED.locationBCentro.id,
    linkedUserId: staffUserId,
  });
  await ensureStaff({
    tenantId: SEED.tenantB.id,
    userId: SEED.userBOwner.id,
    staffId: SEED.staffBCentroOther.id,
    name: SEED.staffBCentroOther.name,
    homeLocationId: SEED.locationBCentro.id,
  });
  await ensureStaff({
    tenantId: SEED.tenantB.id,
    userId: SEED.userBOwner.id,
    staffId: SEED.staffBJardim.id,
    name: SEED.staffBJardim.name,
    homeLocationId: SEED.locationBJardim.id,
  });

  console.log(
    'Seed painel: Navalha (1 staff) + Corte Fino (Carlos STAFF Centro, Rafael Centro, Diego Jardim).',
  );
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

  await ensurePanelFixtures(passwordHash);

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
