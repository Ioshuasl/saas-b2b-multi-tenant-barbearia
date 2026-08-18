import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class MarkEmailVerifiedRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, userId: string): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: new Date() },
      });
    });
  }
}
