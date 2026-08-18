import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { generateRefreshSecret, hashRefreshToken } from '../../helpers/refresh_token.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class RotateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, invitationId: string): Promise<string> {
    const rawToken = generateRefreshSecret();
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: {
          tokenHash: hashRefreshToken(rawToken),
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
      });
    });
    return rawToken;
  }
}
