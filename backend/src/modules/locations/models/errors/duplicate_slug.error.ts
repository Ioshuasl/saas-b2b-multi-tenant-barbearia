import { AppError } from '../../../../shared/domain/errors.js';

export class DuplicateSlugError extends AppError {
  constructor(readonly suggestion?: string) {
    super(
      'DUPLICATE_RESOURCE',
      'Este slug já está em uso.',
      409,
      suggestion ? { suggestion } : undefined,
    );
    this.name = 'DuplicateSlugError';
  }
}
