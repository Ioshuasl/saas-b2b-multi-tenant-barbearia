import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class DeactivateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, customerId: string): Promise<boolean> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.customer.findFirst({
        where: { id: customerId, deletedAt: null },
      });
      if (!existing) return false;

      await tx.customer.update({
        where: { id: customerId },
        data: {
          active: false,
          deletedAt: new Date(),
        },
      });
      return true;
    });
  }
}
