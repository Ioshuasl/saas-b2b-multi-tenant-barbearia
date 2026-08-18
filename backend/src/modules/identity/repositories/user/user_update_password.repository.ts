import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class UpdatePasswordRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, userId: string, passwordHash: string): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, failedAttempts: 0, lockedUntil: null },
      });
    });
  }
}
