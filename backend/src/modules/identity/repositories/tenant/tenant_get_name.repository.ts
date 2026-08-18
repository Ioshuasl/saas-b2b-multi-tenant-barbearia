import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetNameRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<string> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: ctx.tenantId } });
      return tenant?.name ?? 'Barbearia';
    });
  }
}
