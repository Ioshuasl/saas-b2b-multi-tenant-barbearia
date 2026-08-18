import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { MeResponse } from '../../types/user/user_summary.types.js';
import { ROLE_PERMISSIONS } from '../../enum/user/permission.enum.js';
import type { UserRoleName } from '../../enum/user/user_role.enum.js';
import { UserRole } from '../../enum/user/user_role.enum.js';

export class GetMeRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<MeResponse | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.user.findUnique({
        where: { id: ctx.userId },
        include: { tenant: true, userLocations: true },
      });
      if (!row) return null;
      const role = row.role as UserRoleName;
      const locationIds =
        row.role === UserRole.OWNER ? ('ALL' as const) : row.userLocations.map((loc) => loc.locationId);
      return {
        user: {
          id: row.id,
          email: row.email,
          name: row.name,
          phone: row.phone,
          role: row.role,
          status: row.status,
          tenantId: row.tenantId,
          tenantSlug: row.tenant.slug,
          emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
        },
        role: row.role,
        locationIds,
        permissions: ROLE_PERMISSIONS[role] ?? [],
        staffId: null,
      };
    });
  }
}
