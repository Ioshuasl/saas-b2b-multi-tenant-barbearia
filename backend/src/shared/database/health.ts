import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { getPrismaClient } from './tenant_prisma.js';

let redis: Redis | undefined;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
  }
  return redis;
}

export type ReadyStatus = {
  status: 'ok' | 'degraded';
  postgres: boolean;
  redis: boolean;
  storage: boolean;
};

export async function checkReadiness(): Promise<ReadyStatus> {
  const postgres = await pingPostgres();
  const redisOk = await pingRedis();
  const storage = await pingStorage();
  return {
    status: postgres && redisOk ? 'ok' : 'degraded',
    postgres,
    redis: redisOk,
    storage,
  };
}

async function pingPostgres(): Promise<boolean> {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function pingRedis(): Promise<boolean> {
  try {
    const client = getRedis();
    if (client.status === 'wait' || client.status === 'end') {
      await client.connect();
    }
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

async function pingStorage(): Promise<boolean> {
  try {
    const url = new URL('/minio/health/live', env.STORAGE_ENDPOINT);
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}
