import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class ConsumeRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, tokenId: string): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.refreshTokenFamily.update({
        where: { id: tokenId },
        data: { consumedAt: new Date(), revokedAt: new Date() },
      });
    });
  }
}
