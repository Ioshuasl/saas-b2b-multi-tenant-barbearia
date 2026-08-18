import { AppError } from '../../../../shared/domain/errors.js';

export class TooLateToCancelError extends AppError {
  constructor() {
    super('TOO_LATE_TO_CANCEL', 'Prazo para cancelamento expirado.', 422);
    this.name = 'TooLateToCancelError';
  }
}
