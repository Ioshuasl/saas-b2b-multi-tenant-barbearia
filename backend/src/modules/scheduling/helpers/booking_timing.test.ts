import { describe, expect, it } from 'vitest';
import { assertBookingTiming } from './booking_timing.js';
import { LeadTimeViolationError } from '../models/errors/lead_time_violation.error.js';
import { HorizonExceededError } from '../models/errors/horizon_exceeded.error.js';
import { AppError } from '../../../shared/domain/errors.js';

describe('assertBookingTiming', () => {
  const now = new Date('2026-08-18T12:00:00.000Z');

  it('rejeita slot no passado', () => {
    expect(() =>
      assertBookingTiming({
        startsAt: new Date('2026-08-18T11:00:00.000Z'),
        now,
        leadTimeMinutes: 0,
        horizonDays: 60,
        timezone: 'America/Sao_Paulo',
      }),
    ).toThrow(AppError);
  });

  it('rejeita slot antes do lead time', () => {
    expect(() =>
      assertBookingTiming({
        startsAt: new Date('2026-08-18T12:30:00.000Z'),
        now,
        leadTimeMinutes: 60,
        horizonDays: 60,
        timezone: 'America/Sao_Paulo',
      }),
    ).toThrow(LeadTimeViolationError);
  });

  it('rejeita slot além do horizonte', () => {
    expect(() =>
      assertBookingTiming({
        startsAt: new Date('2026-12-01T12:00:00.000Z'),
        now,
        leadTimeMinutes: 0,
        horizonDays: 30,
        timezone: 'America/Sao_Paulo',
      }),
    ).toThrow(HorizonExceededError);
  });

  it('aceita slot dentro da janela', () => {
    expect(() =>
      assertBookingTiming({
        startsAt: new Date('2026-08-25T14:00:00.000Z'),
        now,
        leadTimeMinutes: 60,
        horizonDays: 60,
        timezone: 'America/Sao_Paulo',
      }),
    ).not.toThrow();
  });
});
