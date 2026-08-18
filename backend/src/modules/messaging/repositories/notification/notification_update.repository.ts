import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { NotificationStatusName } from '../../enum/account/messaging_session_status.enum.js';

export class UpdateStatusRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    notificationId: string,
    input: {
      status: NotificationStatusName;
      providerMessageId?: string | null;
      error?: string | null;
      sentAt?: Date | null;
    },
  ): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.notification.update({
        where: { id: notificationId },
        data: {
          status: input.status,
          providerMessageId: input.providerMessageId,
          error: input.error ?? null,
          sentAt: input.sentAt ?? null,
        },
      });
    });
  }
}

export class CancelPendingRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, appointmentId: string): Promise<number> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const result = await tx.notification.updateMany({
        where: {
          appointmentId,
          status: 'PENDING',
          templateKey: { in: ['reminder_24h', 'reminder_2h'] },
        },
        data: { status: 'CANCELED' },
      });
      return result.count;
    });
  }
}
