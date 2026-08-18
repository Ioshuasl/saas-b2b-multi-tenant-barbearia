import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class RevokeFamilyRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, familyId: string): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.refreshTokenFamily.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }
}
