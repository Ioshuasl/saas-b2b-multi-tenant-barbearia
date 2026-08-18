import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { StaffSummary } from '../../types/staff/staff.types.js';
import { toStaffSummary } from './mappers/staff.mapper.js';

const include = { staffLocations: true, staffServices: true } as const;

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<StaffSummary[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.staff.findMany({
        where: { deletedAt: null },
        include,
        orderBy: { name: 'asc' },
      });
      const scoped =
        ctx.locationScope === 'ALL'
          ? rows
          : rows.filter((row) =>
              row.staffLocations.some((link) => ctx.locationIds.includes(link.locationId)),
            );
      return scoped.map(toStaffSummary);
    });
  }
}
