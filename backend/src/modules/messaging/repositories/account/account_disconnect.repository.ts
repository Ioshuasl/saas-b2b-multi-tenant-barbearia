import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { MessagingAccountSummary } from '@repo/contracts';
import { MessagingSessionStatus } from '../../enum/account/messaging_session_status.enum.js';
import { toMessagingAccountSummary } from './mappers/account.mapper.js';

export class DisconnectRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<MessagingAccountSummary> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.whatsappAccount.update({
        where: { tenantId: ctx.tenantId },
        data: {
          status: MessagingSessionStatus.DISCONNECTED,
          killSwitch: true,
          displayPhone: null,
          lastError: null,
        },
      });

      await tx.automation.updateMany({
        where: { tenantId: ctx.tenantId },
        data: { enabled: false },
      });

      return toMessagingAccountSummary(row);
    });
  }
}
