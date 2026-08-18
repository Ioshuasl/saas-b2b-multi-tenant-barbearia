import { describe, expect, it } from 'vitest';
import { AppError } from '../../../shared/domain/errors.js';
import { assertHoneypot } from './public_booking_guard.js';

describe('public_booking_guard', () => {
  it('rejeita honeypot preenchido', () => {
    expect(() => assertHoneypot({ website: 'http://spam.bot' })).toThrow(AppError);
    try {
      assertHoneypot({ website: 'bot' });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(400);
    }
  });

  it('aceita body sem honeypot', () => {
    expect(() => assertHoneypot({})).not.toThrow();
    expect(() => assertHoneypot({ website: '   ' })).not.toThrow();
  });
});
