import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { getLocationBookingSettings, getWorkingWindows, zonedLocalToUtc } from '../../../locations/locations_public.js';
import { assertBookingTiming } from '../../helpers/booking_timing.js';
import {
  enumerateDates,
  slotIsFree,
  splitIntoSlots,
} from '../../helpers/availability_engine.js';
import type { AvailabilityQuerySchema } from '../../schemas/availability.schema.js';
import type { AvailabilityResult } from '../../types/availability/availability.types.js';
import type { FindActiveRepository } from '../../repositories/appointment/appointment_find_active.repository.js';
import type { StaffCandidatesRepository } from '../../repositories/appointment/staff_candidates.repository.js';
import type { SlotCalculateService } from '../appointment/appointment_slot_calculate.service.js';
import { assertLocationInScope, resolveStaffFilter } from '../../helpers/appointment_scope.js';

export class ListService {
  constructor(
    private readonly staffCandidates: StaffCandidatesRepository,
    private readonly findActive: FindActiveRepository,
    private readonly slotCalculate: SlotCalculateService,
  ) {}

  async execute(
    ctx: RequestContext,
    query: AvailabilityQuerySchema,
    actorStaffId?: string,
  ): Promise<AvailabilityResult> {
    assertLocationInScope(ctx, query.locationId);

    const location = await getLocationBookingSettings(ctx.tenantId, query.locationId);
    if (!location) throw new NotFoundError();

    const staffId = resolveStaffFilter(ctx, query.staffId, actorStaffId);
    const candidates = await this.staffCandidates.execute(ctx, {
      locationId: query.locationId,
      serviceIds: query.serviceIds,
      staffId,
    });
    if (candidates.length === 0) {
      return { slots: [], timezone: location.timezone };
    }

    const durationSample = await this.slotCalculate.execute(ctx, {
      locationId: query.locationId,
      serviceIds: query.serviceIds,
      startsAt: new Date(),
    });
    const durationMinutes = durationSample.totalDurationMinutes;
    const now = new Date();
    const dates = enumerateDates(query.from, query.to);
    const slots: AvailabilityResult['slots'] = [];

    for (const date of dates) {
      const dayStart = zonedLocalToUtc(date, 0, 0, location.timezone);
      const dayEnd = zonedLocalToUtc(addDay(date), 0, 0, location.timezone);

      for (const candidate of candidates) {
        const windows = await getWorkingWindows({
          tenantId: ctx.tenantId,
          locationId: query.locationId,
          staffId: candidate.id,
          date,
        });
        const booked = await this.findActive.execute(ctx, {
          staffId: candidate.id,
          rangeStart: dayStart,
          rangeEnd: dayEnd,
        });
        const candidateSlots = splitIntoSlots(windows, durationMinutes);

        for (const slot of candidateSlots) {
          if (!slotIsFree(slot, booked)) continue;
          try {
            assertBookingTiming({
              startsAt: slot.startsAt,
              now,
              leadTimeMinutes: location.bookingLeadTimeMinutes,
              horizonDays: location.bookingHorizonDays,
              timezone: location.timezone,
            });
          } catch {
            continue;
          }
          slots.push({
            startsAt: slot.startsAt.toISOString(),
            endsAt: slot.endsAt.toISOString(),
            staffId: candidate.id,
            staffName: candidate.name,
          });
        }
      }
    }

    slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return { slots, timezone: location.timezone };
  }
}

function addDay(ymd: string): string {
  const date = new Date(`${ymd}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
