import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError, NotFoundError } from '../../../../shared/domain/errors.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import {
  assertLocationAccessible,
  getLocationBookingSettings,
  staffServesLocation,
} from '../../../locations/locations_public.js';
import { HistoryActorType } from '../../enum/appointment/history_actor_type.enum.js';
import { hashRequestBody } from '../../helpers/availability_engine.js';
import { assertBookingTiming } from '../../helpers/booking_timing.js';
import { assertStaffAccess } from '../../helpers/appointment_scope.js';
import { sealAppointmentNotes } from '../../helpers/notes_crypto.js';
import { SlotTakenError } from '../../models/errors/slot_taken.error.js';
import type { AppointmentCreateSchema } from '../../schemas/appointment.schema.js';
import type { AppointmentSourceName } from '../../enum/appointment/appointment_source.enum.js';
import type { AppointmentDetail } from '../../types/appointment/appointment.types.js';
import type { InsertRepository } from '../../repositories/appointment/appointment_insert.repository.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';
import type { ClaimRepository } from '../../repositories/idempotency/idempotency_claim.repository.js';
import {
  idempotencyConflictError,
  requireIdempotencyKey,
} from '../../repositories/idempotency/idempotency_claim.repository.js';
import type { SlotCalculateService } from './appointment_slot_calculate.service.js';
import type { ListService as AvailabilityListService } from '../availability/availability_list.service.js';
import { unsealAppointmentNotes } from '../../helpers/notes_crypto.js';

const CREATE_ROUTE = 'POST /api/v1/appointments';

export class CreateService {
  constructor(
    private readonly slotCalculate: SlotCalculateService,
    private readonly insertRepository: InsertRepository,
    private readonly getRepository: GetRepository,
    private readonly idempotency: ClaimRepository,
    private readonly availability: AvailabilityListService,
    private readonly db = getTenantPrisma(),
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentSchema: AppointmentCreateSchema,
    input: { idempotencyKey: string; actorStaffId?: string },
  ): Promise<AppointmentDetail> {
    const key = requireIdempotencyKey(input.idempotencyKey);
    const requestHash = hashRequestBody(appointmentSchema);
    const cached = await this.idempotency.findValid(ctx, key, CREATE_ROUTE, requestHash);
    if (cached === 'conflict') throw idempotencyConflictError();
    if (cached) {
      const body = cached.responseBody as { data: AppointmentDetail };
      return body.data;
    }

    if (!ctx.locationId) {
      throw new AppError('VALIDATION_ERROR', 'Header X-Location-Id é obrigatório.', 400);
    }

    await assertLocationAccessible(ctx, ctx.locationId);
    assertStaffAccess(ctx, appointmentSchema.staffId, input.actorStaffId);

    const serves = await staffServesLocation(
      ctx.tenantId,
      appointmentSchema.staffId,
      ctx.locationId,
    );
    if (!serves) throw new NotFoundError();

    const settings = await getLocationBookingSettings(ctx.tenantId, ctx.locationId);
    if (!settings) throw new NotFoundError();

    const startsAt = new Date(appointmentSchema.startsAt);
    assertBookingTiming({
      startsAt,
      now: new Date(),
      leadTimeMinutes: settings.bookingLeadTimeMinutes,
      horizonDays: settings.bookingHorizonDays,
      timezone: settings.timezone,
    });

    const slot = await this.slotCalculate.execute(ctx, {
      locationId: ctx.locationId,
      serviceIds: appointmentSchema.serviceIds,
      startsAt,
    });
    const sealedNotes = await sealAppointmentNotes(appointmentSchema.notes);

    try {
      const created = await this.db.runInTenantContext(ctx, async (tx) => {
        return this.insertRepository.executeTx(
          tx,
          ctx,
          {
            locationId: ctx.locationId!,
            customerId: appointmentSchema.customerId,
            staffId: appointmentSchema.staffId,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            totalPriceCents: slot.totalPriceCents,
            source: appointmentSchema.source as AppointmentSourceName,
            notes: appointmentSchema.notes,
            createdBy: ctx.userId,
            serviceLines: slot.serviceLines,
          },
          sealedNotes,
          { actorId: ctx.userId, actorType: HistoryActorType.USER },
        );
      });

      const detail = await this.loadDetail(ctx, created.id);
      await this.idempotency.save(ctx, {
        key,
        route: CREATE_ROUTE,
        requestHash,
        responseStatus: 201,
        responseBody: { data: detail },
      });

      return detail;
    } catch (err) {
      if (err instanceof SlotTakenError) {
        const suggestions = await this.suggestSlots(ctx, appointmentSchema, input.actorStaffId);
        throw new SlotTakenError(suggestions);
      }
      throw err;
    }
  }

  private async loadDetail(ctx: RequestContext, appointmentId: string): Promise<AppointmentDetail> {
    const row = await this.getRepository.execute(ctx, appointmentId);
    if (!row) throw new NotFoundError();
    return {
      ...row,
      notes: await unsealAppointmentNotes(row.notes),
    };
  }

  private async suggestSlots(
    ctx: RequestContext,
    appointmentSchema: AppointmentCreateSchema,
    actorStaffId?: string,
  ): Promise<string[]> {
    if (!ctx.locationId) return [];
    const startsAt = new Date(appointmentSchema.startsAt);
    const from = startsAt.toISOString().slice(0, 10);
    const result = await this.availability.execute(
      ctx,
      {
        locationId: ctx.locationId,
        serviceIds: appointmentSchema.serviceIds,
        staffId: appointmentSchema.staffId,
        from,
        to: from,
      },
      actorStaffId,
    );
    return result.slots.slice(0, 3).map((slot) => slot.startsAt);
  }
}
