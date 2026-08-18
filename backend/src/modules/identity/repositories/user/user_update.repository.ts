import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import { UserStatus } from '../../enum/user/user_status.enum.js';
import type { UserRoleName } from '../../enum/user/user_role.enum.js';

export type UpdateUserInput = {
  role?: UserRoleName;
  locationIds?: string[];
  active?: boolean;
};

export class UpdateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    userId: string,
    userSchema: UpdateUserInput,
  ): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      const data: {
        role?: string;
        status?: string;
      } = {};
      if (userSchema.role) data.role = userSchema.role;
      if (userSchema.active !== undefined) {
        data.status = userSchema.active ? UserStatus.ACTIVE : UserStatus.DISABLED;
      }
      if (Object.keys(data).length > 0) {
        await tx.user.update({ where: { id: userId }, data });
      }

      const nextRole = userSchema.role;
      if (nextRole === UserRole.OWNER) {
        await tx.userLocation.deleteMany({ where: { userId } });
      } else if (userSchema.locationIds) {
        await tx.userLocation.deleteMany({ where: { userId } });
        for (const locationId of userSchema.locationIds) {
          await tx.userLocation.create({
            data: { tenantId: ctx.tenantId, userId, locationId },
          });
        }
      }
    });
  }
}
