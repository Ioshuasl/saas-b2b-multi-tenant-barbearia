import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { env } from '../../../../shared/config/env.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { generateRefreshSecret, hashRefreshToken } from '../../helpers/refresh_token.js';

export class RotateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    input: { currentId: string; userId: string; familyId: string },
  ): Promise<string> {
    const refreshToken = generateRefreshSecret();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.refreshTokenFamily.update({
        where: { id: input.currentId },
        data: { consumedAt: new Date() },
      });
      await tx.refreshTokenFamily.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          userId: input.userId,
          familyId: input.familyId,
          tokenHash,
          expiresAt,
        },
      });
    });

    return refreshToken;
  }
}
