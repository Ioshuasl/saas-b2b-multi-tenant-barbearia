import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import { UserStatus } from '../../enum/user/user_status.enum.js';

export class CountActiveOwnersRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<number> {
    return this.db.runInTenantContext(ctx, async (tx) =>
      tx.user.count({
        where: { role: UserRole.OWNER, status: UserStatus.ACTIVE },
      }),
    );
  }
}
