import { AppError } from '../../../../shared/domain/errors.js';

export class SlotTakenError extends AppError {
  constructor(suggestedSlots: string[] = []) {
    super('SLOT_TAKEN', 'Este horário acabou de ser reservado.', 409, [
      { suggestedSlots },
    ]);
    this.name = 'SlotTakenError';
  }
}
