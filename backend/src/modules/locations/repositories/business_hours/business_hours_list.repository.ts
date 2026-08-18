import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { formatTime } from '../../helpers/working_windows.js';
import type { BusinessHoursView } from '../../types/business_hours/business_hours.types.js';

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    locationId: string,
    staffId: string | null,
  ): Promise<BusinessHoursView> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.businessHours.findMany({
        where: staffId ? { locationId, staffId } : { locationId, staffId: null },
        orderBy: [{ weekday: 'asc' }, { startsAt: 'asc' }],
      });
      return {
        locationId,
        staffId,
        slots: rows.map((row) => ({
          weekday: row.weekday,
          startsAt: formatTime(row.startsAt),
          endsAt: formatTime(row.endsAt),
        })),
      };
    });
  }
}
