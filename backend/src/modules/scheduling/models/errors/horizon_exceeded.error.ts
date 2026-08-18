import { AppError } from '../../../../shared/domain/errors.js';

export class HorizonExceededError extends AppError {
  constructor(horizonDays: number) {
    super(
      'HORIZON_EXCEEDED',
      `Agendamento além do horizonte de ${horizonDays} dias.`,
      422,
      [{ horizonDays }],
    );
    this.name = 'HorizonExceededError';
  }
}
