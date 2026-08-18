import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { AppointmentListFilters, AppointmentSummary } from '../../types/appointment/appointment.types.js';
import { toAppointmentSummary } from './mappers/appointment_summary.mapper.js';

const include = {
  customer: { select: { name: true } },
  staff: { select: { name: true } },
  services: {
    include: { service: { select: { name: true } } },
  },
} as const;

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    filters: AppointmentListFilters,
  ): Promise<AppointmentSummary[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const where: Prisma.AppointmentWhereInput = {};

      if (filters.locationId) where.locationId = filters.locationId;
      if (filters.staffId) where.staffId = filters.staffId;
      if (filters.status) where.status = filters.status;
      if (filters.from || filters.to) {
        where.startsAt = {};
        if (filters.from) where.startsAt.gte = new Date(filters.from);
        if (filters.to) where.startsAt.lte = new Date(filters.to);
      }

      const rows = await tx.appointment.findMany({
        where,
        include,
        orderBy: { startsAt: 'asc' },
      });

      const scoped =
        ctx.locationScope === 'ALL'
          ? rows
          : rows.filter((row) => ctx.locationIds.includes(row.locationId));

      return scoped.map(toAppointmentSummary);
    });
  }
}
