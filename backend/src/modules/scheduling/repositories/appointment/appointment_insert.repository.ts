import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { AppointmentHistoryAction } from '../../enum/appointment/appointment_history_action.enum.js';
import type { HistoryActorTypeName } from '../../enum/appointment/history_actor_type.enum.js';
import { SlotTakenError } from '../../models/errors/slot_taken.error.js';
import type { AppointmentPersistInput, AppointmentRecord } from '../../types/appointment/appointment.types.js';
import { toAppointmentRecord } from './mappers/appointment.mapper.js';
import { AppendRepository } from '../appointment_history/history_append.repository.js';
import { writeAppointmentOutboxTx } from '../outbox/outbox_write.repository.js';
import { APPOINTMENT_SCHEDULED_EVENT } from '../../models/events/appointment_outbox.events.js';

export function isSlotTakenError(err: unknown): boolean {
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';

  if (message.includes('23P01') || message.includes('appointment_staff_no_overlap')) {
    return true;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return message.includes('exclusion');
  }

  return false;
}

export class InsertRepository {
  constructor(
    private readonly db = getTenantPrisma(),
    private readonly historyAppend = new AppendRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    input: AppointmentPersistInput,
    sealedNotes: string | undefined,
    actor: { actorId?: string; actorType: HistoryActorTypeName },
    options?: { outbox?: boolean; tx?: Prisma.TransactionClient },
  ): Promise<AppointmentRecord> {
    if (options?.tx) {
      return this.executeTx(options.tx, ctx, input, sealedNotes, actor, options.outbox !== false);
    }

    return this.db.runInTenantContext(ctx, async (tx) => {
      return this.executeTx(tx, ctx, input, sealedNotes, actor, options?.outbox !== false);
    });
  }

  async executeTx(
    tx: Prisma.TransactionClient,
    ctx: RequestContext,
    input: AppointmentPersistInput,
    sealedNotes: string | undefined,
    actor: { actorId?: string; actorType: HistoryActorTypeName },
    writeOutbox = true,
    outboxExtras?: { notifyCustomer?: boolean; cancelLink?: string; cancelToken?: string },
  ): Promise<AppointmentRecord> {
    const appointmentId = idGenerator.next();
    try {
      const created = await tx.appointment.create({
        data: {
          id: appointmentId,
          tenantId: ctx.tenantId,
          locationId: input.locationId,
          customerId: input.customerId,
          staffId: input.staffId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: input.status ?? 'SCHEDULED',
          source: input.source,
          totalPriceCents: input.totalPriceCents,
          notes: sealedNotes,
          cancelTokenHash: input.cancelTokenHash,
          createdBy: input.createdBy ?? ctx.userId,
        },
      });

      for (const line of input.serviceLines) {
        await tx.appointmentService.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            appointmentId,
            serviceId: line.serviceId,
            priceCents: line.priceCents,
            durationMinutes: line.durationMinutes,
          },
        });
      }

      await this.historyAppend.executeTx(tx, ctx, {
        appointmentId,
        action: AppointmentHistoryAction.CREATED,
        toValue: {
          startsAt: input.startsAt.toISOString(),
          endsAt: input.endsAt.toISOString(),
          staffId: input.staffId,
          serviceIds: input.serviceLines.map((line) => line.serviceId),
        },
        actorId: actor.actorId,
        actorType: actor.actorType,
      });

      if (writeOutbox) {
        await writeAppointmentOutboxTx(tx, ctx, APPOINTMENT_SCHEDULED_EVENT, {
          appointmentId: created.id,
          tenantId: created.tenantId,
          locationId: created.locationId,
          customerId: created.customerId,
          staffId: created.staffId,
          startsAt: created.startsAt.toISOString(),
          endsAt: created.endsAt.toISOString(),
          status: created.status,
          notifyCustomer: outboxExtras?.notifyCustomer,
          cancelLink: outboxExtras?.cancelLink,
          cancelToken: outboxExtras?.cancelToken,
        });
      }

      return toAppointmentRecord(created);
    } catch (err) {
      if (isSlotTakenError(err)) {
        throw new SlotTakenError();
      }
      throw err;
    }
  }
}
