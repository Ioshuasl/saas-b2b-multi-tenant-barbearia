import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { UserSummary } from '../../types/user/user_summary.types.js';
import { UserRole } from '../../enum/user/user_role.enum.js';

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<UserSummary[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.user.findMany({
        include: { userLocations: true },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        status: row.status,
        locationIds:
          row.role === UserRole.OWNER ? [] : row.userLocations.map((loc) => loc.locationId),
        emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
      }));
    });
  }
}
