import { AppError } from '../../../../shared/domain/errors.js';

export class InvalidInviteError extends AppError {
  constructor() {
    super('BUSINESS_RULE_VIOLATION', 'Convite inválido ou expirado.', 422);
    this.name = 'InvalidInviteError';
  }
}
