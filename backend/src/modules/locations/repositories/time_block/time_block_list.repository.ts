import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { TimeBlockSummary } from '../../types/time_block/time_block.types.js';
import { toTimeBlockSummary } from './mappers/time_block.mapper.js';

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    filters: { locationId?: string; staffId?: string },
  ): Promise<TimeBlockSummary[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.timeBlock.findMany({
        where: {
          locationId: filters.locationId,
          staffId: filters.staffId,
        },
        orderBy: { startsAt: 'asc' },
      });
      const scoped =
        ctx.locationScope === 'ALL'
          ? rows
          : rows.filter((row) => ctx.locationIds.includes(row.locationId));
      return scoped.map(toTimeBlockSummary);
    });
  }
}
