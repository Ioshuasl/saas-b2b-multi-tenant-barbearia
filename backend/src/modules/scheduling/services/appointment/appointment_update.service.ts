import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import {
  getLocationBookingSettings,
  staffServesLocation,
} from '../../../locations/locations_public.js';
import { Appointment } from '../../models/appointment.model.js';
import { HistoryActorType } from '../../enum/appointment/history_actor_type.enum.js';
import { assertBookingTiming } from '../../helpers/booking_timing.js';
import { assertLocationInScope, assertStaffAccess } from '../../helpers/appointment_scope.js';import { sealAppointmentNotes } from '../../helpers/notes_crypto.js';
import { SlotTakenError } from '../../models/errors/slot_taken.error.js';
import type { AppointmentUpdateSchema } from '../../schemas/appointment.schema.js';
import type { AppointmentDetail } from '../../types/appointment/appointment.types.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';
import type { UpdateRepository } from '../../repositories/appointment/appointment_update.repository.js';
import type { SlotCalculateService } from './appointment_slot_calculate.service.js';
import type { GetService } from './appointment_get.service.js';

export class UpdateService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly getService: GetService,
    private readonly updateRepository: UpdateRepository,
    private readonly slotCalculate: SlotCalculateService,
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    appointmentSchema: AppointmentUpdateSchema,
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

    if (model.isTerminal()) {
      throw new NotFoundError();
    }

    const nextStaffId = appointmentSchema.staffId ?? current.staffId;
    const nextStartsAt = appointmentSchema.startsAt
      ? new Date(appointmentSchema.startsAt)
      : new Date(current.startsAt);
    const serviceIds =
      appointmentSchema.serviceIds ??
      current.services.map((service) => service.serviceId);

    const rescheduling =
      appointmentSchema.startsAt !== undefined ||
      appointmentSchema.staffId !== undefined ||
      appointmentSchema.serviceIds !== undefined;

    if (rescheduling) {
      assertStaffAccess(ctx, nextStaffId, actorStaffId);
      const serves = await staffServesLocation(ctx.tenantId, nextStaffId, current.locationId);
      if (!serves) throw new NotFoundError();

      const settings = await getLocationBookingSettings(ctx.tenantId, current.locationId);
      if (!settings) throw new NotFoundError();

      assertBookingTiming({
        startsAt: nextStartsAt,
        now: new Date(),
        leadTimeMinutes: settings.bookingLeadTimeMinutes,
        horizonDays: settings.bookingHorizonDays,
        timezone: settings.timezone,
      });

      const slot = await this.slotCalculate.execute(ctx, {
        locationId: current.locationId,
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
              serviceIds: current.services.map((s) => s.serviceId),
            },
          },
          { actorId: ctx.userId, actorType: HistoryActorType.USER },
        );
      } catch (err) {
        if (err instanceof SlotTakenError) throw err;
        throw err;
      }
    }

    if (appointmentSchema.notes !== undefined) {
      const sealed = await sealAppointmentNotes(appointmentSchema.notes);
      await this.updateRepository.updateNotes(ctx, appointmentId, sealed);
    }

    return this.getService.execute(ctx, appointmentId, actorStaffId);
  }
}
