import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import { UserStatus } from '../../enum/user/user_status.enum.js';

export type AcceptInvitationInput = {
  invitationId: string;
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  locationIds: string[];
};

export class AcceptRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, acceptSchema: AcceptInvitationInput): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.user.create({
        data: {
          id: acceptSchema.userId,
          tenantId: ctx.tenantId,
          email: acceptSchema.email,
          passwordHash: acceptSchema.passwordHash,
          name: acceptSchema.name,
          role: acceptSchema.role,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });
      if (acceptSchema.role !== UserRole.OWNER) {
        for (const locationId of acceptSchema.locationIds) {
          await tx.userLocation.create({
            data: {
              tenantId: ctx.tenantId,
              userId: acceptSchema.userId,
              locationId,
            },
          });
        }
      }
      await tx.invitation.update({
        where: { id: acceptSchema.invitationId },
        data: { acceptedAt: new Date() },
      });
    });
  }
}
