import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { HistoryActorType } from '../../enum/appointment/history_actor_type.enum.js';
import { sealAppointmentNotes } from '../../helpers/notes_crypto.js';
import type { AppointmentPersistInput, AppointmentRecord } from '../../types/appointment/appointment.types.js';
import type { InsertRepository } from '../../repositories/appointment/appointment_insert.repository.js';
import type { SlotCalculateService } from './appointment_slot_calculate.service.js';

export class PersistService {
  constructor(
    private readonly slotCalculate: SlotCalculateService,
    private readonly insertRepository: InsertRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    input: Omit<AppointmentPersistInput, 'endsAt' | 'totalPriceCents' | 'serviceLines'> & {
      serviceIds: readonly string[];
    },
  ): Promise<AppointmentRecord> {
    const slot = await this.slotCalculate.execute(ctx, {
      locationId: input.locationId,
      serviceIds: input.serviceIds,
      startsAt: input.startsAt,
    });

    const sealedNotes = await sealAppointmentNotes(input.notes);

    return this.insertRepository.execute(
      ctx,
      {
        locationId: input.locationId,
        customerId: input.customerId,
        staffId: input.staffId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        totalPriceCents: slot.totalPriceCents,
        source: input.source,
        status: input.status,
        notes: input.notes,
        cancelTokenHash: input.cancelTokenHash,
        createdBy: input.createdBy,
        serviceLines: slot.serviceLines,
      },
      sealedNotes,
      { actorId: ctx.userId, actorType: HistoryActorType.USER },
    );
  }
}
