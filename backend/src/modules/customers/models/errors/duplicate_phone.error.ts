import { AppError } from '../../../../shared/domain/errors.js';

export class DuplicatePhoneError extends AppError {
  constructor() {
    super('DUPLICATE_RESOURCE', 'Já existe um cliente com este telefone.', 409);
    this.name = 'DuplicatePhoneError';
  }
}
