import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { User } from '../../models/user.model.js';
import { toUser } from './mappers/user.mapper.js';

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    userId: string,
  ): Promise<{ user: User; tenantSlug: string } | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.user.findUnique({
        where: { id: userId },
        include: { tenant: true },
      });
      if (!row) return null;
      return {
        user: toUser({
          id: row.id,
          tenantId: row.tenantId,
          email: row.email,
          passwordHash: row.passwordHash,
          name: row.name,
          phone: row.phone,
          role: row.role,
          status: row.status,
          lockedUntil: row.lockedUntil,
          failedAttempts: row.failedAttempts,
        }),
        tenantSlug: row.tenant.slug,
      };
    });
  }
}
