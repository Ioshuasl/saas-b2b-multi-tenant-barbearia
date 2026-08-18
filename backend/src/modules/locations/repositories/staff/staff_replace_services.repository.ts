import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class ReplaceServicesRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, staffId: string, serviceIds: string[]): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.staffService.deleteMany({ where: { staffId } });
      if (serviceIds.length === 0) return;
      await tx.staffService.createMany({
        data: serviceIds.map((serviceId) => ({
          tenantId: ctx.tenantId,
          staffId,
          serviceId,
        })),
      });
    });
  }
}
