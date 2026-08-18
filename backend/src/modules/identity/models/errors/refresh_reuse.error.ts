import { AppError } from '../../../../shared/domain/errors.js';

export class RefreshReuseError extends AppError {
  constructor() {
    super('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.', 401);
    this.name = 'RefreshReuseError';
  }
}
