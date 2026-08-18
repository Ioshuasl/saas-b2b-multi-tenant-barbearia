import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { MessagingAccountSummary } from '@repo/contracts';
import { toMessagingAccountSummary } from './mappers/account.mapper.js';

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<MessagingAccountSummary | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.whatsappAccount.findUnique({
        where: { tenantId: ctx.tenantId },
      });
      if (!row) return null;
      return toMessagingAccountSummary(row);
    });
  }
}
