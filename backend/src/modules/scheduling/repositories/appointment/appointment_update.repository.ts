import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { AppointmentHistoryAction } from '../../enum/appointment/appointment_history_action.enum.js';
import type { HistoryActorTypeName } from '../../enum/appointment/history_actor_type.enum.js';
import { isSlotTakenError } from './appointment_insert.repository.js';
import { SlotTakenError } from '../../models/errors/slot_taken.error.js';
import type { ServiceSnapshotLine } from '../../types/appointment/appointment.types.js';
import { toAppointmentRecord } from './mappers/appointment.mapper.js';
import { AppendRepository } from '../appointment_history/history_append.repository.js';
import { writeAppointmentOutboxTx } from '../outbox/outbox_write.repository.js';
import { APPOINTMENT_RESCHEDULED_EVENT } from '../../models/events/appointment_outbox.events.js';

export type RescheduleInput = {
  appointmentId: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
  totalPriceCents: bigint;
  serviceLines: ServiceSnapshotLine[];
  fromValue: Record<string, unknown>;
};

export class UpdateRepository {
  constructor(
    private readonly db = getTenantPrisma(),
    private readonly historyAppend = new AppendRepository(),
  ) {}

  async reschedule(
    ctx: RequestContext,
    input: RescheduleInput,
    actor: { actorId?: string; actorType: HistoryActorTypeName },
  ) {
    return this.db.runInTenantContext(ctx, async (tx) => {
      try {
        const updated = await tx.appointment.update({
          where: { id: input.appointmentId },
          data: {
            staffId: input.staffId,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            totalPriceCents: input.totalPriceCents,
          },
        });

        await tx.appointmentService.deleteMany({
          where: { appointmentId: input.appointmentId },
        });

        for (const line of input.serviceLines) {
          await tx.appointmentService.create({
            data: {
              id: idGenerator.next(),
              tenantId: ctx.tenantId,
              appointmentId: input.appointmentId,
              serviceId: line.serviceId,
              priceCents: line.priceCents,
              durationMinutes: line.durationMinutes,
            },
          });
        }

        await this.historyAppend.executeTx(tx, ctx, {
          appointmentId: input.appointmentId,
          action: AppointmentHistoryAction.RESCHEDULED,
          fromValue: input.fromValue,
          toValue: {
            startsAt: input.startsAt.toISOString(),
            endsAt: input.endsAt.toISOString(),
            staffId: input.staffId,
            serviceIds: input.serviceLines.map((line) => line.serviceId),
          },
          actorId: actor.actorId,
          actorType: actor.actorType,
        });

        await writeAppointmentOutboxTx(tx, ctx, APPOINTMENT_RESCHEDULED_EVENT, {
          appointmentId: updated.id,
          tenantId: updated.tenantId,
          locationId: updated.locationId,
          customerId: updated.customerId,
          staffId: updated.staffId,
          startsAt: updated.startsAt.toISOString(),
          endsAt: updated.endsAt.toISOString(),
          status: updated.status,
        });

        return toAppointmentRecord(updated);
      } catch (err) {
        if (isSlotTakenError(err)) throw new SlotTakenError();
        throw err;
      }
    });
  }

  async updateNotes(
    ctx: RequestContext,
    appointmentId: string,
    sealedNotes: string | undefined,
  ): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { notes: sealedNotes },
      });
    });
  }
}
