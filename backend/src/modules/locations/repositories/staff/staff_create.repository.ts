import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { StaffCreateSchema } from '../../schemas/staff.schema.js';
import type { StaffSummary } from '../../types/staff/staff.types.js';
import { toStaffSummary } from './mappers/staff.mapper.js';

export class CreateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    staffSchema: StaffCreateSchema,
    locationIds: string[],
  ): Promise<StaffSummary> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const created = await tx.staff.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          homeLocationId: staffSchema.homeLocationId,
          name: staffSchema.name,
          photoUrl: staffSchema.photoUrl,
          bio: staffSchema.bio,
          commissionPercent: staffSchema.commissionPercent ?? 0,
          acceptsOnlineBooking: staffSchema.acceptsOnlineBooking ?? true,
          staffLocations: {
            create: locationIds.map((locationId) => ({
              tenantId: ctx.tenantId,
              locationId,
            })),
          },
        },
        include: { staffLocations: true, staffServices: true },
      });
      return toStaffSummary(created);
    });
  }
}
