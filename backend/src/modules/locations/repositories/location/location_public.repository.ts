import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { LocationAddress } from '../../types/location/location.types.js';
import type { PublicLocationCard, PublicLocationDetail } from '../../types/location/location_public.types.js';

export class PublicRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async listLocations(ctx: RequestContext): Promise<PublicLocationCard[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.location.findMany({
        where: { active: true, acceptsOnlineBooking: true },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });

      const cards: PublicLocationCard[] = [];
      for (const row of rows) {
        cards.push({
          id: row.id,
          slug: row.slug,
          name: row.name,
          address: (row.address as LocationAddress | null) ?? null,
          latitude: row.latitude ? Number(row.latitude) : null,
          longitude: row.longitude ? Number(row.longitude) : null,
          bookingAvailable: (await this.listVisibleServices(tx, row.id)).length > 0,
        });
      }
      return cards;
    });
  }

  async getBySlug(ctx: RequestContext, locationSlug: string): Promise<PublicLocationDetail | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.location.findFirst({
        where: { slug: locationSlug, active: true, acceptsOnlineBooking: true },
      });
      if (!row) return null;

      const services = await this.listVisibleServices(tx, row.id);
      const staff = await this.listBookableStaff(tx, row.id);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        timezone: row.timezone,
        phone: row.phone,
        address: (row.address as LocationAddress | null) ?? null,
        latitude: row.latitude ? Number(row.latitude) : null,
        longitude: row.longitude ? Number(row.longitude) : null,
        bookingAvailable: services.length > 0,
        services,
        staff,
      };
    });
  }

  async getCancelDeadlineHours(ctx: RequestContext, locationId: string): Promise<number | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.location.findUnique({
        where: { id: locationId },
        select: { cancelDeadlineHours: true },
      });
      return row?.cancelDeadlineHours ?? null;
    });
  }

  private async listBookableStaff(
    tx: Prisma.TransactionClient,
    locationId: string,
  ): Promise<PublicLocationDetail['staff']> {
    const rows = await tx.staff.findMany({
      where: {
        deletedAt: null,
        active: true,
        acceptsOnlineBooking: true,
        staffLocations: { some: { locationId } },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return rows;
  }

  private async listVisibleServices(
    tx: Prisma.TransactionClient,
    locationId: string,
  ): Promise<PublicLocationDetail['services']> {
    const services = await tx.service.findMany({
      where: { deletedAt: null, active: true, visibleOnline: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const visible: PublicLocationDetail['services'] = [];
    for (const service of services) {
      const override = await tx.locationService.findUnique({
        where: { locationId_serviceId: { locationId, serviceId: service.id } },
      });
      if (override && !override.active) continue;
      visible.push({
        id: service.id,
        name: service.name,
        durationMinutes: override?.durationMinutesOverride ?? service.durationMinutes,
        priceCents: Number(override?.priceCentsOverride ?? service.priceCents),
      });
    }
    return visible;
  }
}
