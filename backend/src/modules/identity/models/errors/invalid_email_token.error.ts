import { AppError } from '../../../../shared/domain/errors.js';

export class InvalidEmailTokenError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Link inválido ou expirado.', 422);
    this.name = 'InvalidEmailTokenError';
  }
}
