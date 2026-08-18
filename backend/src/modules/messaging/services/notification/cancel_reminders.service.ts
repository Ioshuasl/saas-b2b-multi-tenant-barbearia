import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getMessagingQueue } from '../../../../shared/queue/queues.js';
import { MessageTemplateKey } from '../../enum/account/messaging_session_status.enum.js';
import { reminderJobId } from '../../../../shared/queue/job_types.js';
import type { CancelPendingRepository } from '../../repositories/notification/notification_update.repository.js';

export class CancelRemindersService {
  constructor(private readonly cancelPending: CancelPendingRepository) {}

  async execute(ctx: RequestContext, appointmentId: string): Promise<void> {
    const queue = getMessagingQueue();
    const keys = [MessageTemplateKey.REMINDER_24H, MessageTemplateKey.REMINDER_2H];

    for (const templateKey of keys) {
      const jobId = reminderJobId(ctx.tenantId, appointmentId, templateKey);
      const job = await queue.getJob(jobId);
      if (job) await job.remove();
    }

    await this.cancelPending.execute(ctx, appointmentId);
  }
}
