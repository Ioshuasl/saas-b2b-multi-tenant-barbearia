import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { env } from '../../../../shared/config/env.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { generateRefreshSecret, hashRefreshToken } from '../../helpers/refresh_token.js';

export type IssueRefreshResult = {
  refreshToken: string;
  familyId: string;
};

export class LoginRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, userId: string): Promise<IssueRefreshResult> {
    const familyId = idGenerator.next();
    const refreshToken = generateRefreshSecret();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
      await tx.refreshTokenFamily.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          userId,
          familyId,
          tokenHash,
          expiresAt,
        },
      });
    });

    return { refreshToken, familyId };
  }
}
