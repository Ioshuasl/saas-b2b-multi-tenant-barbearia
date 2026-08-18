import { AppError } from '../../../../shared/domain/errors.js';

export class DuplicateEmailError extends AppError {
  constructor() {
    super('DUPLICATE_RESOURCE', 'Não foi possível concluir o cadastro.', 409);
    this.name = 'DuplicateEmailError';
  }
}
