import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { TenantSummary } from '../../types/tenant/tenant.types.js';
import { toTenantSummary } from './mappers/tenant.mapper.js';

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<TenantSummary | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.tenant.findUnique({ where: { id: ctx.tenantId } });
      return row ? toTenantSummary(row) : null;
    });
  }
}
