import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../enum/appointment/appointment_status.enum.js';
import type { AppointmentConflictSummary } from '../../types/appointment/appointment_conflict.types.js';
import type { TimeInterval } from '../../helpers/availability_engine.js';

export class FindActiveRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    input: { staffId: string; rangeStart: Date; rangeEnd: Date },
  ): Promise<TimeInterval[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.appointment.findMany({
        where: {
          staffId: input.staffId,
          status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
          startsAt: { lt: input.rangeEnd },
          endsAt: { gt: input.rangeStart },
        },
        select: { startsAt: true, endsAt: true },
        orderBy: { startsAt: 'asc' },
      });
      return rows.map((row) => ({ startsAt: row.startsAt, endsAt: row.endsAt }));
    });
  }

  async findConflicts(
    ctx: RequestContext,
    input: {
      locationId: string;
      staffId: string | null;
      startsAt: Date;
      endsAt: Date;
    },
  ): Promise<AppointmentConflictSummary[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const where: Prisma.AppointmentWhereInput = {
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      };
      if (input.staffId) {
        where.staffId = input.staffId;
      } else {
        where.locationId = input.locationId;
      }

      const rows = await tx.appointment.findMany({
        where,
        select: {
          id: true,
          locationId: true,
          staffId: true,
          startsAt: true,
          endsAt: true,
          status: true,
        },
        orderBy: { startsAt: 'asc' },
      });

      return rows.map((row) => ({
        id: row.id,
        locationId: row.locationId,
        staffId: row.staffId,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        status: row.status,
      }));
    });
  }
}
