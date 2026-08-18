import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { StaffUpdateSchema } from '../../schemas/staff.schema.js';
import type { StaffSummary } from '../../types/staff/staff.types.js';
import { toStaffSummary } from './mappers/staff.mapper.js';

export class UpdateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    staffId: string,
    staffSchema: StaffUpdateSchema,
  ): Promise<StaffSummary | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const current = await tx.staff.findFirst({
        where: { id: staffId, deletedAt: null },
      });
      if (!current) return null;

      if (staffSchema.homeLocationId && staffSchema.homeLocationId !== current.homeLocationId) {
        await tx.staffLocation.upsert({
          where: {
            tenantId_staffId_locationId: {
              tenantId: ctx.tenantId,
              staffId,
              locationId: staffSchema.homeLocationId,
            },
          },
          create: {
            tenantId: ctx.tenantId,
            staffId,
            locationId: staffSchema.homeLocationId,
          },
          update: {},
        });
      }

      const updated = await tx.staff.update({
        where: { id: staffId },
        data: {
          name: staffSchema.name,
          homeLocationId: staffSchema.homeLocationId,
          photoUrl: staffSchema.photoUrl,
          bio: staffSchema.bio,
          commissionPercent: staffSchema.commissionPercent,
          acceptsOnlineBooking: staffSchema.acceptsOnlineBooking,
          active: staffSchema.active,
        },
        include: { staffLocations: true, staffServices: true },
      });
      return toStaffSummary(updated);
    });
  }
}
