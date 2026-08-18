import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class SnapshotRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    locationId: string,
    serviceId: string,
  ): Promise<{ durationMinutes: number; priceCents: number } | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const service = await tx.service.findFirst({
        where: { id: serviceId, deletedAt: null, active: true },
      });
      if (!service) return null;
      const override = await tx.locationService.findUnique({
        where: { locationId_serviceId: { locationId, serviceId } },
      });
      if (override && !override.active) return null;
      return {
        durationMinutes: override?.durationMinutesOverride ?? service.durationMinutes,
        priceCents: Number(override?.priceCentsOverride ?? service.priceCents),
      };
    });
  }
}
