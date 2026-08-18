import { AppError } from '../../../../shared/domain/errors.js';

export class PlanLimitError extends AppError {
  constructor() {
    super(
      'PLAN_LIMIT_EXCEEDED',
      'Limite do plano atingido. Fale com a operação para ampliar unidades ou profissionais.',
      402,
    );
    this.name = 'PlanLimitError';
  }
}
