import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { Appointment } from '../../models/appointment.model.js';
import { AppointmentStatus } from '../../enum/appointment/appointment_status.enum.js';
import { assertLocationInScope, assertStaffAccess } from '../../helpers/appointment_scope.js';
import type { AppointmentCancelSchema } from '../../schemas/appointment.schema.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';
import type { StatusService } from './appointment_status.service.js';

export class DeleteService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly statusService: StatusService,
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    appointmentSchema: AppointmentCancelSchema,
    actorStaffId?: string,
  ): Promise<void> {
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

    if (model.isTerminal()) {
      throw new NotFoundError();
    }

    await this.statusService.execute(
      ctx,
      appointmentId,
      { status: AppointmentStatus.CANCELLED, reason: appointmentSchema.reason },
      actorStaffId,
    );
  }
}
