import { logger } from './shared/config/logger.js';
import { startWorkers } from './worker/bootstrap.js';

const runtimePromise = startWorkers();

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'worker_shutdown');
  const runtime = await runtimePromise;
  await runtime.stop();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

runtimePromise.catch((err) => {
  logger.error({ err }, 'worker_failed');
  process.exit(1);
});
