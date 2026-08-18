import { AppError } from '../../../shared/domain/errors.js';

export function assertTimeBlockRange(startsAt: Date, endsAt: Date): void {
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new AppError('VALIDATION_ERROR', 'O término do bloqueio deve ser depois do início.', 400);
  }
}
