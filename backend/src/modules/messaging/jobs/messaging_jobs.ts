import type { Job } from 'bullmq';
import { logger } from '../../../shared/config/logger.js';
import {
  workerCtx,
  type CancelRemindersPayload,
  type ProcessOutboxEventPayload,
  type ScheduleRemindersPayload,
  type SendNotificationPayload,
} from '../../../shared/queue/job_types.js';
import { getEmailProvider, getMessagingProvider } from '../helpers/provider_factory.js';
import { CreateRepository as NotificationCreateRepository } from '../repositories/notification/notification_create.repository.js';
import {
  CancelPendingRepository,
  UpdateStatusRepository as NotificationUpdateRepository,
} from '../repositories/notification/notification_update.repository.js';
import { GetContextRepository } from '../repositories/notification/notification_context_get.repository.js';
import { GetTemplateRepository } from '../repositories/template/template_get.repository.js';
import { MarkFailedRepository, MarkProcessedRepository } from '../repositories/outbox/outbox_mark.repository.js';
import { ListPendingRepository } from '../repositories/outbox/outbox_list_pending.repository.js';
import { SendNotificationService } from '../services/notification/send_notification.service.js';
import { ScheduleRemindersService } from '../services/notification/schedule_reminders.service.js';
import { CancelRemindersService } from '../services/notification/cancel_reminders.service.js';
import { ProcessOutboxEventService } from '../services/outbox/process_outbox_event.service.js';
import { DispatchOutboxService } from '../services/outbox/dispatch_outbox.service.js';

function buildSendNotificationService(): SendNotificationService {
  return new SendNotificationService(
    new GetContextRepository(),
    new GetTemplateRepository(),
    new NotificationCreateRepository(),
    new NotificationUpdateRepository(),
    getMessagingProvider(),
    getEmailProvider(),
  );
}

export async function handleSendNotification(job: Job<SendNotificationPayload>): Promise<void> {
  await buildSendNotificationService().execute(workerCtx(job.data), {
    appointmentId: job.data.appointmentId,
    templateKey: job.data.templateKey,
    notifyCustomer: job.data.notifyCustomer,
    cancelLink: job.data.cancelLink,
    cancelToken: job.data.cancelToken,
  });
}

export async function handleScheduleReminders(job: Job<ScheduleRemindersPayload>): Promise<void> {
  await new ScheduleRemindersService(new GetContextRepository()).execute(workerCtx(job.data), {
    appointmentId: job.data.appointmentId,
    startsAt: job.data.startsAt,
  });
}

export async function handleCancelReminders(job: Job<CancelRemindersPayload>): Promise<void> {
  await new CancelRemindersService(new CancelPendingRepository()).execute(
    workerCtx(job.data),
    job.data.appointmentId,
  );
}

export async function handleProcessOutboxEvent(job: Job<ProcessOutboxEventPayload>): Promise<void> {
  await new ProcessOutboxEventService(new MarkProcessedRepository(), new MarkFailedRepository()).execute(
    job.data,
  );
}

export async function handleDispatchOutbox(): Promise<void> {
  const count = await new DispatchOutboxService(
    new ListPendingRepository(),
    new MarkFailedRepository(),
  ).execute();
  if (count > 0) {
    logger.info({ count }, 'outbox_dispatch_enqueued');
  }
}
