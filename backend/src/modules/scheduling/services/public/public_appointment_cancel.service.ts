import { NotFoundError } from '../../../../shared/domain/errors.js';
import { getLocationCancelDeadlineHours } from '../../../locations/locations_public.js';
import { AppointmentStatus } from '../../enum/appointment/appointment_status.enum.js';
import { CancelActor } from '../../enum/appointment/cancel_actor.enum.js';
import { HistoryActorType } from '../../enum/appointment/history_actor_type.enum.js';
import { verifyCancelToken } from '../../helpers/cancel_token.js';
import { InvalidCancelTokenError } from '../../models/errors/consent_required.error.js';
import { TooLateToCancelError } from '../../models/errors/too_late_to_cancel.error.js';
import type { PublicCancelSchema } from '../../schemas/public_booking.schema.js';
import type { GetByTokenRepository } from '../../repositories/appointment/appointment_get_by_token.repository.js';
import type { StatusRepository } from '../../repositories/appointment/appointment_status.repository.js';
import type { ScopeService } from './public_scope.service.js';
import { Appointment } from '../../models/appointment.model.js';
import { AppointmentSource } from '../../enum/appointment/appointment_source.enum.js';

export class AppointmentCancelService {
  constructor(
    private readonly scope: ScopeService,
    private readonly getByToken: GetByTokenRepository,
    private readonly statusRepository: StatusRepository,
  ) {}

  async execute(
    tenantSlug: string,
    locationSlug: string,
    appointmentId: string,
    token: string,
    publicCancelSchema: PublicCancelSchema,
    requestId: string,
  ): Promise<void> {
    const { scope, ctx } = await this.scope.resolveLocation(tenantSlug, locationSlug, requestId);
    const row = await this.getByToken.execute(ctx, appointmentId, scope.locationId);
    if (!row || !verifyCancelToken(token, row.cancelTokenHash)) {
      throw new InvalidCancelTokenError();
    }

    const deadlineHours =
      (await getLocationCancelDeadlineHours(scope.tenantId, scope.locationId)) ?? 2;
    const deadline = new Date(row.startsAt.getTime() - deadlineHours * 60 * 60 * 1000);
    if (new Date() >= deadline) {
      throw new TooLateToCancelError();
    }

    const model = new Appointment({
      id: row.id,
      tenantId: row.tenantId,
      locationId: row.locationId,
      customerId: row.customerId,
      staffId: row.staffId,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status: row.status as Appointment['props']['status'],
      source: AppointmentSource.PUBLIC_PAGE,
      totalPriceCents: row.totalPriceCents,
    });
    if (model.isTerminal()) throw new NotFoundError();

    const reason = publicCancelSchema.reason ?? 'Cancelado pelo cliente';
    model.withStatus(AppointmentStatus.CANCELLED, new Date(), reason);

    await this.statusRepository.execute(
      ctx,
      {
        appointmentId,
        fromStatus: row.status as Appointment['props']['status'],
        toStatus: AppointmentStatus.CANCELLED,
        cancelReason: reason,
        cancelActor: CancelActor.CUSTOMER,
      },
      { actorType: HistoryActorType.CUSTOMER },
    );
  }
}
