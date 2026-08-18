import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class ReplaceLocationsRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, staffId: string, locationIds: string[]): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.staffLocation.deleteMany({ where: { staffId } });
      await tx.staffLocation.createMany({
        data: locationIds.map((locationId) => ({
          tenantId: ctx.tenantId,
          staffId,
          locationId,
        })),
      });
    });
  }
}
