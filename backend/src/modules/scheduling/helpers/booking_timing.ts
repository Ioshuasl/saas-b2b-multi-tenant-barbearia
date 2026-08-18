import { HorizonExceededError } from '../models/errors/horizon_exceeded.error.js';
import { LeadTimeViolationError } from '../models/errors/lead_time_violation.error.js';
import { AppError } from '../../../shared/domain/errors.js';

export function assertBookingTiming(input: {
  startsAt: Date;
  now: Date;
  leadTimeMinutes: number;
  horizonDays: number;
  timezone: string;
}): void {
  if (input.startsAt.getTime() <= input.now.getTime()) {
    throw new AppError('PAST_SLOT', 'Não é possível agendar no passado.', 422);
  }

  const earliest = input.now.getTime() + input.leadTimeMinutes * 60_000;
  if (input.startsAt.getTime() < earliest) {
    throw new LeadTimeViolationError(input.leadTimeMinutes);
  }

  const horizonEnd = new Date(input.now.getTime() + input.horizonDays * 24 * 60 * 60 * 1000);
  if (input.startsAt.getTime() > horizonEnd.getTime()) {
    throw new HorizonExceededError(input.horizonDays);
  }
}
