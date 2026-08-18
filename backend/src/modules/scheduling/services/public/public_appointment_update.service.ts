import { NotFoundError } from '../../../../shared/domain/errors.js';
import {
  getLocationBookingSettings,
  staffServesLocation,
} from '../../../locations/locations_public.js';
import { Appointment } from '../../models/appointment.model.js';
import { HistoryActorType } from '../../enum/appointment/history_actor_type.enum.js';
import { verifyCancelToken } from '../../helpers/cancel_token.js';
import { assertBookingTiming } from '../../helpers/booking_timing.js';
import { InvalidCancelTokenError } from '../../models/errors/consent_required.error.js';
import { SlotTakenError } from '../../models/errors/slot_taken.error.js';
import type { PublicRescheduleSchema } from '../../schemas/public_booking.schema.js';
import type { GetByTokenRepository } from '../../repositories/appointment/appointment_get_by_token.repository.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';
import type { UpdateRepository } from '../../repositories/appointment/appointment_update.repository.js';
import type { SlotCalculateService } from '../appointment/appointment_slot_calculate.service.js';
import type { ScopeService } from './public_scope.service.js';

export class AppointmentUpdateService {
  constructor(
    private readonly scope: ScopeService,
    private readonly getByToken: GetByTokenRepository,
    private readonly getRepository: GetRepository,
    private readonly updateRepository: UpdateRepository,
    private readonly slotCalculate: SlotCalculateService,
  ) {}

  async execute(
    tenantSlug: string,
    locationSlug: string,
    appointmentId: string,
    token: string,
    publicRescheduleSchema: PublicRescheduleSchema,
    requestId: string,
  ) {
    const { scope, ctx } = await this.scope.resolveLocation(tenantSlug, locationSlug, requestId);
    const row = await this.getByToken.execute(ctx, appointmentId, scope.locationId);
    if (!row || !verifyCancelToken(token, row.cancelTokenHash)) {
      throw new InvalidCancelTokenError();
    }

    const current = await this.getRepository.execute(ctx, appointmentId);
    if (!current) throw new NotFoundError();

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
    if (model.isTerminal()) throw new NotFoundError();

    const nextStaffId = publicRescheduleSchema.staffId ?? current.staffId;
    const nextStartsAt = new Date(publicRescheduleSchema.startsAt);
    const serviceIds =
      publicRescheduleSchema.serviceIds ?? current.services.map((line) => line.serviceId);

    const serves = await staffServesLocation(ctx.tenantId, nextStaffId, scope.locationId);
    if (!serves) throw new NotFoundError();

    const settings = await getLocationBookingSettings(ctx.tenantId, scope.locationId);
    if (!settings) throw new NotFoundError();

    assertBookingTiming({
      startsAt: nextStartsAt,
      now: new Date(),
      leadTimeMinutes: settings.bookingLeadTimeMinutes,
      horizonDays: settings.bookingHorizonDays,
      timezone: settings.timezone,
    });

    const slot = await this.slotCalculate.execute(ctx, {
      locationId: scope.locationId,
      serviceIds,
      startsAt: nextStartsAt,
    });

    try {
      await this.updateRepository.reschedule(
        ctx,
        {
          appointmentId,
          staffId: nextStaffId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          totalPriceCents: slot.totalPriceCents,
          serviceLines: slot.serviceLines,
          fromValue: {
            startsAt: current.startsAt,
            endsAt: current.endsAt,
            staffId: current.staffId,
            serviceIds: current.services.map((line) => line.serviceId),
          },
        },
        { actorType: HistoryActorType.CUSTOMER },
      );
    } catch (err) {
      if (err instanceof SlotTakenError) throw err;
      throw err;
    }

    const updated = await this.getRepository.execute(ctx, appointmentId);
    if (!updated) throw new NotFoundError();
    return {
      id: updated.id,
      status: updated.status,
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      staff: { id: updated.staffId, name: updated.staffName },
      services: updated.services.map((line) => ({
        name: line.name,
        durationMinutes: line.durationMinutes,
        priceCents: line.priceCents,
      })),
      totalPriceCents: updated.totalPriceCents,
    };
  }
}
