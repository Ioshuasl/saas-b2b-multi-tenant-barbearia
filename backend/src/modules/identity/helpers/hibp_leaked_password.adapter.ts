import { createHash } from 'node:crypto';
import { logger } from '../../../shared/config/logger.js';
import type { LeakedPasswordPort } from '../types/ports/leaked_password.port.js';

const HIBP_TIMEOUT_MS = 2_000;
const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/';

export class HibpLeakedPasswordAdapter implements LeakedPasswordPort {
  async isLeaked(password: string): Promise<boolean> {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    try {
      const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
        headers: {
          'Add-Padding': 'true',
          'User-Agent': 'saas-barbearia-identity',
        },
        signal: AbortSignal.timeout(HIBP_TIMEOUT_MS),
      });
      if (!response.ok) {
        logger.warn({ status: response.status }, 'hibp_unavailable');
        return false;
      }
      const body = await response.text();
      return body.split(/\r?\n/).some((line) => {
        const [hashSuffix, count] = line.split(':');
        return hashSuffix === suffix && Number(count) > 0;
      });
    } catch (err) {
      logger.warn({ err }, 'hibp_unavailable');
      return false;
    }
  }
}
