import { AppError } from '../../../../shared/domain/errors.js';

export class ConsentRequiredError extends AppError {
  constructor() {
    super('CONSENT_REQUIRED', 'Consentimento para tratamento de dados é obrigatório.', 422);
    this.name = 'ConsentRequiredError';
  }
}

export class MaxFutureBookingsError extends AppError {
  constructor() {
    super(
      'MAX_FUTURE_BOOKINGS',
      'Limite de 3 agendamentos futuros por telefone atingido.',
      422,
    );
    this.name = 'MaxFutureBookingsError';
  }
}

export class InvalidCancelTokenError extends AppError {
  constructor() {
    super('INVALID_CANCEL_TOKEN', 'Token de cancelamento inválido.', 404);
    this.name = 'InvalidCancelTokenError';
  }
}
