import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { ServiceSummary } from '../../types/service/service.types.js';
import { toServiceSummary } from './mappers/service.mapper.js';

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<ServiceSummary[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.service.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
      return rows.map(toServiceSummary);
    });
  }
}
