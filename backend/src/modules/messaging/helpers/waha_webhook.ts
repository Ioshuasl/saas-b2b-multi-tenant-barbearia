import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../../shared/config/env.js';

export function getWebhookHmacKey(): string | undefined {
  return env.WAHA_WEBHOOK_HMAC_KEY ?? env.WAHA_API_KEY;
}

export function verifyWahaWebhookHmac(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = getWebhookHmacKey();
  if (!secret) {
    return env.NODE_ENV === 'test' || env.MESSAGING_PROVIDER === 'fake';
  }
  if (!signatureHeader) return false;

  const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
  const received = signatureHeader.startsWith('sha512=')
    ? signatureHeader.slice('sha512='.length)
    : signatureHeader;

  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
}

export function mapWahaSessionStatus(wahaStatus: string): string {
  switch (wahaStatus.toUpperCase()) {
    case 'WORKING':
    case 'CONNECTED':
      return 'CONNECTED';
    case 'SCAN_QR_CODE':
    case 'STARTING':
      return 'PENDING';
    case 'FAILED':
      return 'ERROR';
    case 'STOPPED':
    case 'LOGOUT':
      return 'DISCONNECTED';
    default:
      return 'PENDING';
  }
}

export function buildWebhookEventId(payload: { id?: string; event?: string; session?: string; timestamp?: number }): string {
  if (payload.id) return payload.id;
  return `${payload.event ?? 'unknown'}:${payload.session ?? 'unknown'}:${payload.timestamp ?? Date.now()}`;
}
