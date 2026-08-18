import { AppError } from '../../../../shared/domain/errors.js';

export class LeadTimeViolationError extends AppError {
  constructor(leadTimeMinutes: number) {
    super(
      'LEAD_TIME_VIOLATION',
      `Antecedência mínima de ${leadTimeMinutes} minutos não respeitada.`,
      422,
      [{ leadTimeMinutes }],
    );
    this.name = 'LeadTimeViolationError';
  }
}
