import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  buildWebhookEventId,
  mapWahaSessionStatus,
  verifyWahaWebhookHmac,
} from './waha_webhook.js';

describe('mapWahaSessionStatus', () => {
  it.each([
    ['WORKING', 'CONNECTED'],
    ['CONNECTED', 'CONNECTED'],
    ['SCAN_QR_CODE', 'PENDING'],
    ['STARTING', 'PENDING'],
    ['FAILED', 'ERROR'],
    ['STOPPED', 'DISCONNECTED'],
    ['LOGOUT', 'DISCONNECTED'],
    ['unknown', 'PENDING'],
  ])('%s → %s', (input, expected) => {
    expect(mapWahaSessionStatus(input)).toBe(expected);
  });
});

describe('buildWebhookEventId', () => {
  it('usa id do payload quando existe', () => {
    expect(buildWebhookEventId({ id: 'evt-1', event: 'session.status' })).toBe('evt-1');
  });

  it('compõe fallback estável', () => {
    expect(
      buildWebhookEventId({ event: 'message.ack', session: 'ioshua', timestamp: 100 }),
    ).toBe('message.ack:ioshua:100');
  });
});

describe('verifyWahaWebhookHmac', () => {
  it('aceita HMAC SHA-512 válido', () => {
    const raw = Buffer.from('{"ok":true}');
    const sig = createHmac('sha512', 'test-hmac-secret').update(raw).digest('hex');
    expect(verifyWahaWebhookHmac(raw, sig)).toBe(true);
    expect(verifyWahaWebhookHmac(raw, `sha512=${sig}`)).toBe(true);
  });

  it('rejeita assinatura inválida ou ausente', () => {
    const raw = Buffer.from('{"ok":true}');
    expect(verifyWahaWebhookHmac(raw, undefined)).toBe(false);
    expect(verifyWahaWebhookHmac(raw, 'abcd')).toBe(false);
  });
});
