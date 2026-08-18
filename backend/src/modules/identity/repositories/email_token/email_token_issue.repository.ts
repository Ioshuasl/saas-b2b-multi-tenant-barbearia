import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { generateRefreshSecret, hashRefreshToken } from '../../helpers/refresh_token.js';
import type { EmailTokenPurposeName } from '../../enum/auth/email_token_purpose.enum.js';

export class IssueRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    input: { userId: string; purpose: EmailTokenPurposeName; ttlMs: number },
  ): Promise<string> {
    const rawToken = generateRefreshSecret();
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.emailToken.updateMany({
        where: { userId: input.userId, purpose: input.purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.emailToken.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          userId: input.userId,
          purpose: input.purpose,
          tokenHash: hashRefreshToken(rawToken),
          expiresAt: new Date(Date.now() + input.ttlMs),
        },
      });
    });
    return rawToken;
  }
}
