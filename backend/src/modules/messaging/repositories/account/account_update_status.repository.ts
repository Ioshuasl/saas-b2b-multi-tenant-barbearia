import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { MessagingAccountSummary } from '@repo/contracts';
import type { MessagingSessionStatusName } from '../../enum/account/messaging_session_status.enum.js';
import { toMessagingAccountSummary } from './mappers/account.mapper.js';

export class UpdateStatusRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    input: {
      status: MessagingSessionStatusName;
      displayPhone?: string | null;
      lastError?: string | null;
    },
  ): Promise<MessagingAccountSummary> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.whatsappAccount.update({
        where: { tenantId: ctx.tenantId },
        data: {
          status: input.status,
          displayPhone: input.displayPhone,
          lastError: input.lastError ?? null,
        },
      });
      return toMessagingAccountSummary(row);
    });
  }
}
