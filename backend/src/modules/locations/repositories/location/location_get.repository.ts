import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { LocationSummary } from '../../types/location/location_get.types.js';
import { toLocationSummary } from './location.mapper.js';

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, locationId: string): Promise<LocationSummary | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.location.findUnique({ where: { id: locationId } });
      return row ? toLocationSummary(row) : null;
    });
  }
}
