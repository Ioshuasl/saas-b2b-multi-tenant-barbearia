import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import { EmailTokenPurpose } from '../../enum/auth/email_token_purpose.enum.js';
import { InvalidEmailTokenError } from '../../models/errors/invalid_email_token.error.js';
import type { GetByHashRepository } from '../../repositories/email_token/email_token_get_by_hash.repository.js';
import type { ConsumeRepository } from '../../repositories/email_token/email_token_consume.repository.js';
import type { MarkEmailVerifiedRepository } from '../../repositories/user/user_mark_email_verified.repository.js';
import { hashRefreshToken } from '../../helpers/refresh_token.js';

export class VerifyEmailAction {
  constructor(
    private readonly getByHash: GetByHashRepository,
    private readonly consumeRepository: ConsumeRepository,
    private readonly markVerified: MarkEmailVerifiedRepository,
  ) {}

  async execute(rawToken: string, requestMeta: RequestMeta): Promise<void> {
    const token = await this.getByHash.execute(hashRefreshToken(rawToken));
    if (
      !token ||
      token.props.purpose !== EmailTokenPurpose.EMAIL_VERIFY ||
      !token.isUsable
    ) {
      throw new InvalidEmailTokenError();
    }
    const ctx: RequestContext = {
      tenantId: token.props.tenantId,
      userId: token.props.userId,
      requestId: requestMeta.requestId,
      role: 'SYSTEM',
      locationScope: 'ALL',
      locationIds: [],
    };
    await this.markVerified.execute(ctx, token.props.userId);
    await this.consumeRepository.execute(ctx, token.props.id);
  }
}
