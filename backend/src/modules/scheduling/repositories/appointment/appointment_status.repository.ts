import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { AppointmentHistoryAction } from '../../enum/appointment/appointment_history_action.enum.js';
import type { AppointmentStatusName } from '../../enum/appointment/appointment_status.enum.js';
import type { HistoryActorTypeName } from '../../enum/appointment/history_actor_type.enum.js';
import { toAppointmentRecord } from './mappers/appointment.mapper.js';
import { AppendRepository } from '../appointment_history/history_append.repository.js';
import { writeAppointmentOutboxTx } from '../outbox/outbox_write.repository.js';
import {
  APPOINTMENT_CANCELLED_EVENT,
  APPOINTMENT_COMPLETED_EVENT,
  APPOINTMENT_NO_SHOW_EVENT,
} from '../../models/events/appointment_outbox.events.js';
import { AppointmentStatus } from '../../enum/appointment/appointment_status.enum.js';
import type { CancelActorName } from '../../enum/appointment/cancel_actor.enum.js';
import { CancelActor } from '../../enum/appointment/cancel_actor.enum.js';

export class StatusRepository {
  constructor(
    private readonly db = getTenantPrisma(),
    private readonly historyAppend = new AppendRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    input: {
      appointmentId: string;
      fromStatus: AppointmentStatusName;
      toStatus: AppointmentStatusName;
      cancelReason?: string;
      cancelActor?: CancelActorName;
    },
    actor: { actorId?: string; actorType: HistoryActorTypeName },
  ) {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const now = new Date();
      const data: Prisma.AppointmentUpdateInput = { status: input.toStatus };

      if (input.toStatus === AppointmentStatus.CANCELLED) {
        data.canceledAt = now;
        data.cancelReason = input.cancelReason;
        data.canceledBy = input.cancelActor ?? CancelActor.USER;
      }

      const updated = await tx.appointment.update({
        where: { id: input.appointmentId },
        data,
      });

      const action =
        input.toStatus === AppointmentStatus.CANCELLED
          ? AppointmentHistoryAction.CANCELLED
          : AppointmentHistoryAction.STATUS_CHANGED;

      await this.historyAppend.executeTx(tx, ctx, {
        appointmentId: input.appointmentId,
        action,
        fromValue: { status: input.fromStatus },
        toValue: {
          status: input.toStatus,
          ...(input.cancelReason ? { reason: input.cancelReason } : {}),
        },
        actorId: actor.actorId,
        actorType: actor.actorType,
      });

      const outboxName = outboxEventForStatus(input.toStatus);
      if (outboxName) {
        await writeAppointmentOutboxTx(tx, ctx, outboxName, {
          appointmentId: updated.id,
          tenantId: updated.tenantId,
          locationId: updated.locationId,
          customerId: updated.customerId,
          staffId: updated.staffId,
          startsAt: updated.startsAt.toISOString(),
          endsAt: updated.endsAt.toISOString(),
          status: updated.status,
        });
      }

      return toAppointmentRecord(updated);
    });
  }
}

function outboxEventForStatus(status: AppointmentStatusName): string | null {
  switch (status) {
    case AppointmentStatus.CANCELLED:
      return APPOINTMENT_CANCELLED_EVENT;
    case AppointmentStatus.COMPLETED:
      return APPOINTMENT_COMPLETED_EVENT;
    case AppointmentStatus.NO_SHOW:
      return APPOINTMENT_NO_SHOW_EVENT;
    default:
      return null;
  }
}
