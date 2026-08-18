import { Worker, type Job } from 'bullmq';
import { logger } from '../shared/config/logger.js';
import { getRedisConnection, closeRedisConnection } from '../shared/queue/connection.js';
import { closeQueues, getMessagingQueue, getPlatformQueue } from '../shared/queue/queues.js';
import { JOB_NAMES, QUEUE_NAMES } from '../shared/queue/job_types.js';
import {
  handleCancelReminders,
  handleDispatchOutbox,
  handleProcessOutboxEvent,
  handleScheduleReminders,
  handleSendNotification,
} from '../modules/messaging/jobs/messaging_jobs.js';
import type {
  CancelRemindersPayload,
  ProcessOutboxEventPayload,
  ScheduleRemindersPayload,
  SendNotificationPayload,
} from '../shared/queue/job_types.js';

const DISPATCH_INTERVAL_MS = 5_000;

export type WorkerRuntime = {
  stop: () => Promise<void>;
  drain: () => Promise<void>;
  dispatchOnce: () => Promise<void>;
};

export async function startWorkers(): Promise<WorkerRuntime> {
  const connection = getRedisConnection();

  const platformWorker = new Worker(
    QUEUE_NAMES.PLATFORM,
    async (job: Job) => {
      if (job.name === JOB_NAMES.PROCESS_OUTBOX_EVENT) {
        await handleProcessOutboxEvent(job as Job<ProcessOutboxEventPayload>);
      }
    },
    { connection, concurrency: 2 },
  );

  const messagingWorker = new Worker(
    QUEUE_NAMES.MESSAGING,
    async (job: Job) => {
      switch (job.name) {
        case JOB_NAMES.SEND_NOTIFICATION:
          await handleSendNotification(job as Job<SendNotificationPayload>);
          break;
        case JOB_NAMES.SCHEDULE_REMINDERS:
          await handleScheduleReminders(job as Job<ScheduleRemindersPayload>);
          break;
        case JOB_NAMES.CANCEL_REMINDERS:
          await handleCancelReminders(job as Job<CancelRemindersPayload>);
          break;
        default:
          logger.warn({ name: job.name }, 'unknown_messaging_job');
      }
    },
    { connection, concurrency: 5 },
  );

  platformWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, err: err.message }, 'platform_job_failed');
  });
  messagingWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, err: err.message }, 'messaging_job_failed');
  });

  const dispatchTimer = setInterval(() => {
    void handleDispatchOutbox().catch((err) => {
      logger.error({ err }, 'dispatch_outbox_interval_failed');
    });
  }, DISPATCH_INTERVAL_MS);

  logger.info('worker_started');

  return {
    async dispatchOnce() {
      await handleDispatchOutbox();
    },
    async drain() {
      await handleDispatchOutbox();
      await waitForQueueIdle(getPlatformQueue());
      await waitForQueueIdle(getMessagingQueue());
    },
    async stop() {
      clearInterval(dispatchTimer);
      await Promise.all([platformWorker.close(), messagingWorker.close()]);
      await closeQueues();
      await closeRedisConnection();
      logger.info('worker_stopped');
    },
  };
}

async function waitForQueueIdle(queue: Awaited<ReturnType<typeof getPlatformQueue>>): Promise<void> {
  for (let i = 0; i < 120; i++) {
    const counts = await queue.getJobCounts('waiting', 'active');
    if (counts.waiting + counts.active === 0) return;
    await sleep(250);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
