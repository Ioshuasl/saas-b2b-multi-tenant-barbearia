import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class ServesLocationRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, staffId: string, locationId: string): Promise<boolean> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.staffLocation.findUnique({
        where: {
          tenantId_staffId_locationId: {
            tenantId: ctx.tenantId,
            staffId,
            locationId,
          },
        },
      });
      return Boolean(row);
    });
  }
}
