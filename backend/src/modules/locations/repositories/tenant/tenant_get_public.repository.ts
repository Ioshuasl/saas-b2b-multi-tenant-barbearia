import { Prisma } from '@prisma/client';
import { getPrismaClient, getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type TenantPublic = {
  id: string;
  name: string;
  logoUrl: string | null;
  locations: Array<{ id: string; slug: string; name: string }>;
};

export class GetPublicRepository {
  constructor(
    private readonly prisma = getPrismaClient(),
    private readonly db = getTenantPrisma(),
  ) {}

  async execute(slug: string): Promise<TenantPublic | null> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; name: string; slug: string }>>(
      Prisma.sql`SELECT id, name, slug FROM platform.lookup_tenant_by_slug(${slug}::citext)`,
    );
    const tenant = rows[0];
    if (!tenant) return null;

    const details = await this.db.runInTenantContext(
      {
        tenantId: tenant.id,
        userId: '00000000-0000-0000-0000-000000000000',
        requestId: 'locations_public',
        role: 'SYSTEM',
        locationScope: 'ALL',
        locationIds: [],
      },
      async (tx) => {
        const record = await tx.tenant.findUnique({
          where: { id: tenant.id },
          select: { logoUrl: true },
        });
        const locations = await tx.location.findMany({
          where: { active: true, acceptsOnlineBooking: true },
          select: { id: true, slug: true, name: true },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });
        return { logoUrl: record?.logoUrl ?? null, locations };
      },
    );

    return {
      id: tenant.id,
      name: tenant.name,
      logoUrl: details.logoUrl,
      locations: details.locations,
    };
  }
}
