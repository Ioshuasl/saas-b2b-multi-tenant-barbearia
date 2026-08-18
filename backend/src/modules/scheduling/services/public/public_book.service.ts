import type { Request } from 'express';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { getOrCreateByPhone, CustomerOrigin } from '../../../customers/customers_public.js';
import {
  getLocationBookingSettings,
  staffServesLocation,
} from '../../../locations/locations_public.js';
import { AppointmentSource } from '../../enum/appointment/appointment_source.enum.js';
import { HistoryActorType } from '../../enum/appointment/history_actor_type.enum.js';
import { generateCancelToken, hashCancelToken } from '../../helpers/cancel_token.js';
import { hashRequestBody } from '../../helpers/availability_engine.js';
import { assertBookingTiming } from '../../helpers/booking_timing.js';
import {
  ConsentRequiredError,
  MaxFutureBookingsError,
} from '../../models/errors/consent_required.error.js';
import { SlotTakenError } from '../../models/errors/slot_taken.error.js';
import type { PublicBookSchema } from '../../schemas/public_booking.schema.js';
import type { PublicAppointmentCreated } from '../../types/public/public_booking.types.js';
import type { InsertRepository } from '../../repositories/appointment/appointment_insert.repository.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';
import type { CountFutureRepository } from '../../repositories/appointment/appointment_count_future.repository.js';
import type { ClaimRepository } from '../../repositories/idempotency/idempotency_claim.repository.js';
import {
  idempotencyConflictError,
  requireIdempotencyKey,
} from '../../repositories/idempotency/idempotency_claim.repository.js';
import type { SlotCalculateService } from '../appointment/appointment_slot_calculate.service.js';
import type { ListService as AvailabilityListService } from '../availability/availability_list.service.js';
import type { ScopeService } from './public_scope.service.js';
import {
  assertCaptchaIfRequired,
  assertHoneypot,
  registerPublicBookingFailure,
  resetPublicBookingFailures,
} from '../../helpers/public_booking_guard.js';

const CREATE_ROUTE = 'POST /api/v1/public/:tenantSlug/:locationSlug/appointments';

export class BookService {
  constructor(
    private readonly scope: ScopeService,
    private readonly slotCalculate: SlotCalculateService,
    private readonly insertRepository: InsertRepository,
    private readonly getRepository: GetRepository,
    private readonly countFuture: CountFutureRepository,
    private readonly idempotency: ClaimRepository,
    private readonly availability: AvailabilityListService,
    private readonly db = getTenantPrisma(),
  ) {}

  async execute(
    req: Request,
    tenantSlug: string,
    locationSlug: string,
    publicBookSchema: PublicBookSchema,
    idempotencyKey: string,
  ): Promise<PublicAppointmentCreated> {
    assertHoneypot(publicBookSchema);
    assertCaptchaIfRequired(req, publicBookSchema.captchaToken);

    if (!publicBookSchema.consentDataProcessing) {
      throw new ConsentRequiredError();
    }

    const { ctx } = await this.scope.resolveLocation(tenantSlug, locationSlug, req.requestId);
    const route = CREATE_ROUTE.replace(':tenantSlug', tenantSlug).replace(':locationSlug', locationSlug);
    const requestHash = hashRequestBody(publicBookSchema);
    const key = requireIdempotencyKey(idempotencyKey);
    const cached = await this.idempotency.findValid(ctx, key, route, requestHash);
    if (cached === 'conflict') throw idempotencyConflictError();
    if (cached) {
      return (cached.responseBody as { data: PublicAppointmentCreated }).data;
    }

    const locationId = ctx.locationId!;
    const settings = await getLocationBookingSettings(ctx.tenantId, locationId);
    if (!settings) throw new NotFoundError();

    const startsAt = new Date(publicBookSchema.startsAt);
    assertBookingTiming({
      startsAt,
      now: new Date(),
      leadTimeMinutes: settings.bookingLeadTimeMinutes,
      horizonDays: settings.bookingHorizonDays,
      timezone: settings.timezone,
    });

    const futureCount = await this.countFuture.execute(ctx, publicBookSchema.customer.phone);
    if (futureCount >= 3) throw new MaxFutureBookingsError();

    const customer = await getOrCreateByPhone(ctx, {
      phone: publicBookSchema.customer.phone,
      name: publicBookSchema.customer.name,
      email: publicBookSchema.customer.email,
      locationId,
      origin: CustomerOrigin.PUBLIC_PAGE,
      marketingOptIn: publicBookSchema.consentWhatsappMarketing,
    });

    let staffId = publicBookSchema.staffId ?? undefined;
    if (!staffId) {
      staffId = await this.resolveStaffFromAvailability(ctx, {
        locationId,
        serviceIds: publicBookSchema.serviceIds,
        startsAt,
      });
    }

    const serves = await staffServesLocation(ctx.tenantId, staffId, locationId);
    if (!serves) throw new NotFoundError();

    const slot = await this.slotCalculate.execute(ctx, {
      locationId,
      serviceIds: publicBookSchema.serviceIds,
      startsAt,
    });

    const cancelToken = generateCancelToken();
    const cancelTokenHash = hashCancelToken(cancelToken);

    try {
      const created = await this.db.runInTenantContext(ctx, async (tx) => {
        return this.insertRepository.executeTx(
          tx,
          ctx,
          {
            locationId,
            customerId: customer.id,
            staffId,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            totalPriceCents: slot.totalPriceCents,
            source: AppointmentSource.PUBLIC_PAGE,
            cancelTokenHash,
            serviceLines: slot.serviceLines,
          },
          undefined,
          { actorType: HistoryActorType.CUSTOMER },
          true,
          { cancelToken },
        );
      });

      const detail = await this.getRepository.execute(ctx, created.id);
      if (!detail) throw new NotFoundError();

      const response: PublicAppointmentCreated = {
        id: detail.id,
        status: detail.status,
        startsAt: detail.startsAt,
        endsAt: detail.endsAt,
        staff: { id: detail.staffId, name: detail.staffName },
        services: detail.services.map((line) => ({
          name: line.name,
          durationMinutes: line.durationMinutes,
          priceCents: line.priceCents,
        })),
        totalPriceCents: detail.totalPriceCents,
        cancelToken,
      };

      await this.idempotency.save(ctx, {
        key,
        route,
        requestHash,
        responseStatus: 201,
        responseBody: { data: response },
      });

      resetPublicBookingFailures(req);
      return response;
    } catch (err) {
      registerPublicBookingFailure(req);
      if (err instanceof SlotTakenError) {
        const suggestions = await this.suggestSlots(ctx, {
          locationId,
          serviceIds: publicBookSchema.serviceIds,
          staffId,
          startsAt,
        });
        throw new SlotTakenError(suggestions);
      }
      throw err;
    }
  }

  private async resolveStaffFromAvailability(
    ctx: RequestContext,
    input: { locationId: string; serviceIds: readonly string[]; startsAt: Date },
  ): Promise<string> {
    const from = input.startsAt.toISOString().slice(0, 10);
    const result = await this.availability.execute(ctx, {
      locationId: input.locationId,
      serviceIds: [...input.serviceIds],
      from,
      to: from,
    });
    const target = input.startsAt.getTime();
    const match = result.slots.find(
      (slot) => Math.abs(new Date(slot.startsAt).getTime() - target) < 60_000,
    );
    if (!match) throw new NotFoundError();
    return match.staffId;
  }

  private async suggestSlots(
    ctx: RequestContext,
    input: {
      locationId: string;
      serviceIds: readonly string[];
      staffId: string;
      startsAt: Date;
    },
  ): Promise<string[]> {
    const from = input.startsAt.toISOString().slice(0, 10);
    const result = await this.availability.execute(ctx, {
      locationId: input.locationId,
      serviceIds: [...input.serviceIds],
      staffId: input.staffId,
      from,
      to: from,
    });
    return result.slots.slice(0, 3).map((slot) => slot.startsAt);
  }
}
