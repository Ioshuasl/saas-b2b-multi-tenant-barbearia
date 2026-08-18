import { AppError } from '../../../../shared/domain/errors.js';
import type { AppointmentStatusName } from '../../enum/appointment/appointment_status.enum.js';

export class InvalidStateTransitionError extends AppError {
  constructor(from: AppointmentStatusName, to: AppointmentStatusName) {
    super(
      'INVALID_STATE_TRANSITION',
      `Transição inválida: ${from} → ${to}.`,
      409,
      [{ from, to }],
    );
    this.name = 'InvalidStateTransitionError';
  }
}
