import { AppError } from '../../../../shared/domain/errors.js';

export class LastOwnerError extends AppError {
  constructor() {
    super(
      'BUSINESS_RULE_VIOLATION',
      'O último OWNER do tenant não pode ser removido nem rebaixado.',
      422,
    );
    this.name = 'LastOwnerError';
  }
}
