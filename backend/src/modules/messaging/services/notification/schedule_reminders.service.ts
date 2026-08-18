import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getMessagingQueue } from '../../../../shared/queue/queues.js';
import {
  JOB_NAMES,
  reminderJobId,
  type ScheduleRemindersPayload,
  type SendNotificationPayload,
  sendNotificationJobId,
} from '../../../../shared/queue/job_types.js';
import { MessageTemplateKey } from '../../enum/account/messaging_session_status.enum.js';
import {
  REMINDER_2H_MS,
  REMINDER_24H_MS,
  reminderSendAt,
} from '../../helpers/silence_window.js';
import type { GetContextRepository } from '../../repositories/notification/notification_context_get.repository.js';

export class ScheduleRemindersService {
  constructor(private readonly contextGet: GetContextRepository) {}

  async execute(ctx: RequestContext, input: { appointmentId: string; startsAt: string }): Promise<void> {
    const context = await this.contextGet.execute(ctx, input.appointmentId);
    if (!context || context.status === 'CANCELLED') return;

    const startsAt = new Date(input.startsAt);
    const queue = getMessagingQueue();
    const reminders = [
      { key: MessageTemplateKey.REMINDER_24H, offset: REMINDER_24H_MS },
      { key: MessageTemplateKey.REMINDER_2H, offset: REMINDER_2H_MS },
    ] as const;

    for (const reminder of reminders) {
      const sendAt = reminderSendAt(startsAt, reminder.offset, context.locationTimezone);
      const delay = Math.max(0, sendAt.getTime() - Date.now());
      const payload: SendNotificationPayload = {
        tenantId: ctx.tenantId,
        requestId: ctx.requestId,
        appointmentId: input.appointmentId,
        templateKey: reminder.key,
      };

      await queue.add(JOB_NAMES.SEND_NOTIFICATION, payload, {
        jobId: reminderJobId(ctx.tenantId, input.appointmentId, reminder.key),
        delay,
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 5,
        backoff: { type: 'exponential', delay: 30_000 },
      });
    }
  }
}
