import { AppError } from '../../../../shared/domain/errors.js';

export class DefaultLocationError extends AppError {
  constructor(message: string) {
    super('BUSINESS_RULE_VIOLATION', message, 422);
    this.name = 'DefaultLocationError';
  }
}
