import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class DeleteRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, invitationId: string): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { expiresAt: new Date() },
      });
    });
  }
}
