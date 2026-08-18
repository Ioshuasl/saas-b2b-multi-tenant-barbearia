import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getMessagingQueue } from '../../../../shared/queue/queues.js';
import {
  JOB_NAMES,
  type CancelRemindersPayload,
  type ProcessOutboxEventPayload,
  type ScheduleRemindersPayload,
  type SendNotificationPayload,
  sendNotificationJobId,
} from '../../../../shared/queue/job_types.js';
import { MessageTemplateKey } from '../../enum/account/messaging_session_status.enum.js';
import { SchedulingOutboxEvent } from '../../enum/outbox/scheduling_outbox_event.enum.js';
import type { MarkProcessedRepository, MarkFailedRepository } from '../../repositories/outbox/outbox_mark.repository.js';
import { OUTBOX_MAX_ATTEMPTS } from '../../../../shared/queue/job_types.js';

type AppointmentOutboxPayload = {
  appointmentId: string;
  startsAt: string;
  notifyCustomer?: boolean;
  cancelLink?: string;
  cancelToken?: string;
};

export class ProcessOutboxEventService {
  constructor(
    private readonly markProcessed: MarkProcessedRepository,
    private readonly markFailed: MarkFailedRepository,
  ) {}

  async execute(payload: ProcessOutboxEventPayload): Promise<void> {
    const ctx: RequestContext = {
      tenantId: payload.tenantId,
      userId: 'worker',
      requestId: payload.requestId,
      role: 'OWNER',
      locationScope: 'ALL',
      locationIds: [],
    };

    const data = payload.payload as AppointmentOutboxPayload;

    if (!payload.eventName.startsWith('scheduling.')) {
      await this.markProcessed.execute(payload.outboxEventId);
      return;
    }

    if (!data.appointmentId) {
      throw new Error('Outbox payload sem appointmentId.');
    }

    const queue = getMessagingQueue();
    const notifyCustomer = data.notifyCustomer !== false;

    try {
      switch (payload.eventName) {
        case SchedulingOutboxEvent.APPOINTMENT_SCHEDULED: {
          await this.enqueueSend(queue, {
            tenantId: ctx.tenantId,
            requestId: ctx.requestId,
            appointmentId: data.appointmentId,
            templateKey: MessageTemplateKey.APPOINTMENT_CONFIRMATION,
            notifyCustomer,
            cancelLink: data.cancelLink,
            cancelToken: data.cancelToken,
          });
          await queue.add(
            JOB_NAMES.SCHEDULE_REMINDERS,
            {
              tenantId: ctx.tenantId,
              requestId: ctx.requestId,
              appointmentId: data.appointmentId,
              startsAt: data.startsAt,
            } satisfies ScheduleRemindersPayload,
            { jobId: `schedule-reminders-${ctx.tenantId}-${data.appointmentId}`, removeOnComplete: true },
          );
          break;
        }
        case SchedulingOutboxEvent.APPOINTMENT_RESCHEDULED: {
          await queue.add(
            JOB_NAMES.CANCEL_REMINDERS,
            {
              tenantId: ctx.tenantId,
              requestId: ctx.requestId,
              appointmentId: data.appointmentId,
            } satisfies CancelRemindersPayload,
            { jobId: `cancel-reminders-${ctx.tenantId}-${data.appointmentId}-${Date.now()}`, removeOnComplete: true },
          );
          await this.enqueueSend(queue, {
            tenantId: ctx.tenantId,
            requestId: ctx.requestId,
            appointmentId: data.appointmentId,
            templateKey: MessageTemplateKey.APPOINTMENT_RESCHEDULED,
            notifyCustomer,
            cancelLink: data.cancelLink,
            cancelToken: data.cancelToken,
          });
          await queue.add(
            JOB_NAMES.SCHEDULE_REMINDERS,
            {
              tenantId: ctx.tenantId,
              requestId: ctx.requestId,
              appointmentId: data.appointmentId,
              startsAt: data.startsAt,
            } satisfies ScheduleRemindersPayload,
            { jobId: `schedule-reminders-${ctx.tenantId}-${data.appointmentId}-${Date.now()}`, removeOnComplete: true },
          );
          break;
        }
        case SchedulingOutboxEvent.APPOINTMENT_CANCELLED: {
          await queue.add(
            JOB_NAMES.CANCEL_REMINDERS,
            {
              tenantId: ctx.tenantId,
              requestId: ctx.requestId,
              appointmentId: data.appointmentId,
            } satisfies CancelRemindersPayload,
            { jobId: `cancel-reminders-${ctx.tenantId}-${data.appointmentId}-cancel`, removeOnComplete: true },
          );
          await this.enqueueSend(queue, {
            tenantId: ctx.tenantId,
            requestId: ctx.requestId,
            appointmentId: data.appointmentId,
            templateKey: MessageTemplateKey.APPOINTMENT_CANCELLED,
            notifyCustomer,
            cancelLink: data.cancelLink,
            cancelToken: data.cancelToken,
          });
          break;
        }
        default:
          break;
      }

      await this.markProcessed.execute(payload.outboxEventId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.markFailed.execute(payload.outboxEventId, message, OUTBOX_MAX_ATTEMPTS);
      throw err;
    }
  }

  private async enqueueSend(
    queue: ReturnType<typeof getMessagingQueue>,
    payload: SendNotificationPayload & { cancelToken?: string },
  ): Promise<void> {
    await queue.add(JOB_NAMES.SEND_NOTIFICATION, payload, {
      jobId: sendNotificationJobId(payload.tenantId, payload.appointmentId, payload.templateKey),
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
    });
  }
}
