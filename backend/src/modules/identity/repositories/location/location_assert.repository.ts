import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';

export class AssertLocationsRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, locationIds: readonly string[]): Promise<void> {
    if (locationIds.length === 0) return;
    await this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.location.findMany({
        where: { id: { in: [...locationIds] }, active: true },
        select: { id: true },
      });
      if (rows.length !== locationIds.length) {
        throw new NotFoundError();
      }
    });
    if (ctx.locationScope !== 'ALL') {
      for (const locationId of locationIds) {
        if (!ctx.locationIds.includes(locationId)) {
          throw new NotFoundError();
        }
      }
    }
  }
}
