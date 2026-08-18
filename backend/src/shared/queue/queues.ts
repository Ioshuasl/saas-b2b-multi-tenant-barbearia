import { Queue } from 'bullmq';
import { getRedisConnection } from './connection.js';
import { QUEUE_NAMES } from './job_types.js';

let platformQueue: Queue | undefined;
let messagingQueue: Queue | undefined;

export function getPlatformQueue(): Queue {
  if (!platformQueue) {
    platformQueue = new Queue(QUEUE_NAMES.PLATFORM, { connection: getRedisConnection() });
  }
  return platformQueue;
}

export function getMessagingQueue(): Queue {
  if (!messagingQueue) {
    messagingQueue = new Queue(QUEUE_NAMES.MESSAGING, { connection: getRedisConnection() });
  }
  return messagingQueue;
}

export async function closeQueues(): Promise<void> {
  await Promise.all([platformQueue?.close(), messagingQueue?.close()]);
  platformQueue = undefined;
  messagingQueue = undefined;
}
