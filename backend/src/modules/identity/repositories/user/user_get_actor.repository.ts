import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import { UserStatus } from '../../enum/user/user_status.enum.js';
import type { Actor } from '../../types/auth/actor.types.js';

export class GetActorRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, userId: string): Promise<Actor | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { userLocations: true },
      });
      if (!user || user.status !== UserStatus.ACTIVE) {
        return null;
      }
      if (user.role === UserRole.OWNER) {
        return { role: user.role, locationIds: 'ALL' };
      }
      return {
        role: user.role,
        locationIds: user.userLocations.map((row) => row.locationId),
      };
    });
  }
}
