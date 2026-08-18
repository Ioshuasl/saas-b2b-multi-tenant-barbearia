import { AppError } from '../../../../shared/domain/errors.js';

export class LeakedPasswordError extends AppError {
  constructor() {
    super(
      'BUSINESS_RULE_VIOLATION',
      'Esta senha aparece em vazamentos conhecidos. Escolha outra.',
      422,
    );
    this.name = 'LeakedPasswordError';
  }
}
