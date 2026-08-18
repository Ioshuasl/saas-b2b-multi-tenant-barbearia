import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { LocationSummary } from '../../types/location/location.types.js';
import { toLocationSummary } from './location.mapper.js';

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<LocationSummary[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.location.findMany({ orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });
      const scoped =
        ctx.locationScope === 'ALL'
          ? rows
          : rows.filter((row) => ctx.locationIds.includes(row.id));
      return scoped.map(toLocationSummary);
    });
  }
}
