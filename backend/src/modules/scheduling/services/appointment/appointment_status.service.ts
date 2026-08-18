import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { Appointment } from '../../models/appointment.model.js';
import { HistoryActorType } from '../../enum/appointment/history_actor_type.enum.js';
import { assertLocationInScope, assertStaffAccess } from '../../helpers/appointment_scope.js';
import type { AppointmentStatusSchema } from '../../schemas/appointment.schema.js';
import type { AppointmentDetail } from '../../types/appointment/appointment.types.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';
import type { StatusRepository } from '../../repositories/appointment/appointment_status.repository.js';
import type { GetService } from './appointment_get.service.js';
import type { AppointmentStatusName } from '../../enum/appointment/appointment_status.enum.js';
import { AppointmentStatus } from '../../enum/appointment/appointment_status.enum.js';

export class StatusService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly statusRepository: StatusRepository,
    private readonly getService: GetService,
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    appointmentSchema: AppointmentStatusSchema,
    actorStaffId?: string,
  ): Promise<AppointmentDetail> {
    const current = await this.getRepository.execute(ctx, appointmentId);
    if (!current) throw new NotFoundError();

    assertLocationInScope(ctx, current.locationId);
    assertStaffAccess(ctx, current.staffId, actorStaffId);

    const model = new Appointment({
      id: current.id,
      tenantId: ctx.tenantId,
      locationId: current.locationId,
      customerId: current.customerId,
      staffId: current.staffId,
      startsAt: new Date(current.startsAt),
      endsAt: new Date(current.endsAt),
      status: current.status,
      source: current.source,
      totalPriceCents: BigInt(current.totalPriceCents),
    });

    const now = new Date();
    const nextStatus = appointmentSchema.status as AppointmentStatusName;
    model.withStatus(nextStatus, now, appointmentSchema.reason);

    await this.statusRepository.execute(
      ctx,
      {
        appointmentId,
        fromStatus: current.status,
        toStatus: nextStatus,
        cancelReason:
          nextStatus === AppointmentStatus.CANCELLED ? appointmentSchema.reason : undefined,
      },
      { actorId: ctx.userId, actorType: HistoryActorType.USER },
    );

    return this.getService.execute(ctx, appointmentId, actorStaffId);
  }
}
