import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class SlugAvailableRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, slug: string): Promise<boolean> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ available: boolean }>>(
        Prisma.sql`SELECT platform.tenant_slug_available(${slug}::citext, ${ctx.tenantId}::uuid) AS available`,
      );
      return Boolean(rows[0]?.available);
    });
  }
}
