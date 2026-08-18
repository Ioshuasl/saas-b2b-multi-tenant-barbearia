import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { MessagingAccountSummary } from '@repo/contracts';
import { MessagingSessionStatus } from '../../enum/account/messaging_session_status.enum.js';
import { buildSessionName, toMessagingAccountSummary } from './mappers/account.mapper.js';

export class UpsertRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    input: { riskAcceptedAt: Date },
  ): Promise<MessagingAccountSummary> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const sessionName = buildSessionName(ctx.tenantId);
      const existing = await tx.whatsappAccount.findUnique({
        where: { tenantId: ctx.tenantId },
      });

      if (existing) {
        const row = await tx.whatsappAccount.update({
          where: { id: existing.id },
          data: {
            riskAcceptedAt: input.riskAcceptedAt,
            killSwitch: false,
            lastError: null,
          },
        });
        return toMessagingAccountSummary(row);
      }

      const row = await tx.whatsappAccount.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          sessionName,
          status: MessagingSessionStatus.PENDING,
          riskAcceptedAt: input.riskAcceptedAt,
          killSwitch: false,
        },
      });
      return toMessagingAccountSummary(row);
    });
  }
}
