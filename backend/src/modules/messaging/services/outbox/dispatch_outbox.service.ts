import { getPlatformQueue, getMessagingQueue } from '../../../../shared/queue/queues.js';
import {
  JOB_NAMES,
  OUTBOX_MAX_ATTEMPTS,
  type ProcessOutboxEventPayload,
} from '../../../../shared/queue/job_types.js';
import type { ListPendingRepository } from '../../repositories/outbox/outbox_list_pending.repository.js';
import type { MarkFailedRepository } from '../../repositories/outbox/outbox_mark.repository.js';

export class DispatchOutboxService {
  constructor(
    private readonly listPending: ListPendingRepository,
    private readonly markFailed: MarkFailedRepository,
  ) {}

  async execute(requestId = 'dispatch-outbox'): Promise<number> {
    const rows = await this.listPending.execute(50);
    if (rows.length === 0) return 0;

    const platformQueue = getPlatformQueue();
    const messagingQueue = getMessagingQueue();
    let enqueued = 0;

    for (const row of rows) {
      const payload: ProcessOutboxEventPayload = {
        tenantId: row.tenantId,
        requestId,
        outboxEventId: row.id,
        eventName: row.name,
        payload: row.payload,
      };

      try {
        await platformQueue.add(JOB_NAMES.PROCESS_OUTBOX_EVENT, payload, {
          removeOnComplete: true,
          removeOnFail: 100,
          attempts: 3,
          backoff: { type: 'exponential', delay: 10_000 },
        });
        enqueued += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.markFailed.execute(row.id, message, OUTBOX_MAX_ATTEMPTS);
      }
    }

    return enqueued;
  }
}
