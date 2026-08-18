import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetByUserRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, userId: string): Promise<string | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.staff.findFirst({
        where: { userId, deletedAt: null, active: true },
        select: { id: true },
      });
      return row?.id ?? null;
    });
  }
}
