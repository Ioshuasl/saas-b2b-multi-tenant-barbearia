import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

const LOCK_AFTER = 5;
const LOCK_MS = 10 * 60 * 1000;

export class RecordFailureRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, userId: string, currentFailures: number): Promise<void> {
    const failedAttempts = currentFailures + 1;
    const lockedUntil = failedAttempts >= LOCK_AFTER ? new Date(Date.now() + LOCK_MS) : null;

    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { failedAttempts, lockedUntil },
      });
    });
  }
}
