import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { ServiceSummary } from '../../types/service/service.types.js';
import { toServiceSummary } from './mappers/service.mapper.js';

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, serviceId: string): Promise<ServiceSummary | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.service.findFirst({
        where: { id: serviceId, deletedAt: null },
      });
      return row ? toServiceSummary(row) : null;
    });
  }
}
