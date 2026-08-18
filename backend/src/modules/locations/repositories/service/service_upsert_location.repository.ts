import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { LocationServiceUpsertSchema } from '../../schemas/service.schema.js';

export class UpsertLocationRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    locationId: string,
    serviceId: string,
    locationServiceSchema: LocationServiceUpsertSchema,
  ): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.locationService.upsert({
        where: { locationId_serviceId: { locationId, serviceId } },
        create: {
          tenantId: ctx.tenantId,
          locationId,
          serviceId,
          active: locationServiceSchema.active,
          priceCentsOverride:
            locationServiceSchema.priceCentsOverride === undefined ||
            locationServiceSchema.priceCentsOverride === null
              ? null
              : BigInt(locationServiceSchema.priceCentsOverride),
          durationMinutesOverride: locationServiceSchema.durationMinutesOverride ?? null,
        },
        update: {
          active: locationServiceSchema.active,
          priceCentsOverride:
            locationServiceSchema.priceCentsOverride === undefined
              ? undefined
              : locationServiceSchema.priceCentsOverride === null
                ? null
                : BigInt(locationServiceSchema.priceCentsOverride),
          durationMinutesOverride: locationServiceSchema.durationMinutesOverride,
        },
      });
    });
  }
}
