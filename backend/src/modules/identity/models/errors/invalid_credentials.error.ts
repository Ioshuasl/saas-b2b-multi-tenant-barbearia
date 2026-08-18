import { AppError } from '../../../../shared/domain/errors.js';

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('UNAUTHENTICATED', 'E-mail ou senha inválidos.', 401);
    this.name = 'InvalidCredentialsError';
  }
}
