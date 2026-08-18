import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetTemplateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, templateKey: string): Promise<{ body: string; category: string } | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const tenantTemplate = await tx.messageTemplate.findFirst({
        where: { tenantId: ctx.tenantId, key: templateKey, status: 'ACTIVE' },
      });
      if (tenantTemplate) {
        return { body: tenantTemplate.body, category: tenantTemplate.category };
      }

      const globalTemplate = await tx.messageTemplate.findFirst({
        where: { tenantId: null, key: templateKey, status: 'ACTIVE' },
      });
      if (!globalTemplate) return null;
      return { body: globalTemplate.body, category: globalTemplate.category };
    });
  }
}
