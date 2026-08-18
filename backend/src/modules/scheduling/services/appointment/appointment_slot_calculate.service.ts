import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { buildCalculatedSlot } from '../../helpers/appointment_timing.js';
import { resolveServiceSnapshots } from '../../helpers/service_snapshots.js';
import type {
  CalculatedAppointmentSlot,
  ServiceSnapshotLine,
} from '../../types/appointment/appointment.types.js';

export class SlotCalculateService {
  async execute(
    ctx: RequestContext,
    input: {
      locationId: string;
      serviceIds: readonly string[];
      startsAt: Date;
    },
  ): Promise<CalculatedAppointmentSlot> {
    const serviceLines = await resolveServiceSnapshots({
      tenantId: ctx.tenantId,
      locationId: input.locationId,
      serviceIds: input.serviceIds,
    });

    return this.fromLines(input.startsAt, serviceLines);
  }

  fromLines(startsAt: Date, serviceLines: ServiceSnapshotLine[]): CalculatedAppointmentSlot {
    const { endsAt, totalPriceCents, totalDurationMinutes } = buildCalculatedSlot(startsAt, serviceLines);
    return {
      startsAt,
      endsAt,
      totalPriceCents,
      totalDurationMinutes,
      serviceLines,
    };
  }
}
