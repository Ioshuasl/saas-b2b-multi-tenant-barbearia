import { AppError } from '../../../shared/domain/errors.js';

export function assertHoursRange(startsAt: string, endsAt: string): void {
  if (startsAt >= endsAt) {
    throw new AppError('VALIDATION_ERROR', 'O horário final deve ser depois do inicial.', 400);
  }
}
