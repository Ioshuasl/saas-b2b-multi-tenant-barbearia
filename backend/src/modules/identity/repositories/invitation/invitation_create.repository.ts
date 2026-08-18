import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { generateRefreshSecret, hashRefreshToken } from '../../helpers/refresh_token.js';
import type { UserRoleName } from '../../enum/user/user_role.enum.js';

export type CreateInvitationInput = {
  email: string;
  role: UserRoleName;
  locationIds: string[];
  invitedBy: string;
};

export type CreateInvitationResult = {
  id: string;
  rawToken: string;
};

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class CreateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    invitationSchema: CreateInvitationInput,
  ): Promise<CreateInvitationResult> {
    const rawToken = generateRefreshSecret();
    const id = idGenerator.next();
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.invitation.create({
        data: {
          id,
          tenantId: ctx.tenantId,
          email: invitationSchema.email,
          role: invitationSchema.role,
          locationIds: invitationSchema.locationIds,
          tokenHash: hashRefreshToken(rawToken),
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          invitedBy: invitationSchema.invitedBy,
        },
      });
    });
    return { id, rawToken };
  }
}
