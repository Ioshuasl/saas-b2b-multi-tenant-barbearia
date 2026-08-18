import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class DeleteRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, timeBlockId: string): Promise<boolean> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const current = await tx.timeBlock.findUnique({ where: { id: timeBlockId } });
      if (!current) return false;
      await tx.timeBlock.delete({ where: { id: timeBlockId } });
      return true;
    });
  }
}
