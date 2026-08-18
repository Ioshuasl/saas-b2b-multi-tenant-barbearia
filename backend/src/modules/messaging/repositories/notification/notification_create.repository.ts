import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { MessagingChannelName } from '../../enum/account/messaging_session_status.enum.js';
import type { NotificationStatusName } from '../../enum/account/messaging_session_status.enum.js';

export type NotificationInsertInput = {
  locationId: string;
  appointmentId: string;
  customerId: string;
  channel: MessagingChannelName;
  provider: string;
  templateKey: string;
  recipient: string;
  scheduledFor?: Date | null;
  status: NotificationStatusName;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
};

export class CreateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, input: NotificationInsertInput): Promise<string> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const id = idGenerator.next();
      await tx.notification.create({
        data: {
          id,
          tenantId: ctx.tenantId,
          locationId: input.locationId,
          appointmentId: input.appointmentId,
          customerId: input.customerId,
          channel: input.channel,
          provider: input.provider,
          templateKey: input.templateKey,
          recipient: input.recipient,
          scheduledFor: input.scheduledFor ?? null,
          status: input.status,
          providerMessageId: input.providerMessageId ?? null,
          error: input.error ?? null,
          sentAt: input.sentAt ?? null,
        },
      });
      return id;
    });
  }
}
