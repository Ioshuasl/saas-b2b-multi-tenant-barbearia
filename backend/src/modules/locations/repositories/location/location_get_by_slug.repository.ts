import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetBySlugRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, slug: string, exceptId?: string): Promise<boolean> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.location.findFirst({
        where: {
          slug,
          ...(exceptId ? { id: { not: exceptId } } : {}),
        },
        select: { id: true },
      });
      const history = await tx.locationSlugHistory.findFirst({
        where: {
          slug,
          expiresAt: { gt: new Date() },
          ...(exceptId ? { locationId: { not: exceptId } } : {}),
        },
        select: { slug: true },
      });
      return Boolean(row || history);
    });
  }
}
