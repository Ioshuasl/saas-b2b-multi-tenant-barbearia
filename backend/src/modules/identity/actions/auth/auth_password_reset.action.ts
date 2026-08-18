import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { EmailTokenPurpose } from '../../enum/auth/email_token_purpose.enum.js';
import { InvalidEmailTokenError } from '../../models/errors/invalid_email_token.error.js';
import { LeakedPasswordError } from '../../models/errors/leaked_password.error.js';
import type { AuthPasswordResetSchema } from '../../schemas/auth.schema.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { EmailPort } from '../../types/ports/email.port.js';
import type { LeakedPasswordPort } from '../../types/ports/leaked_password.port.js';
import type { GetRepository } from '../../repositories/user/user_get.repository.js';
import type { GetByHashRepository } from '../../repositories/email_token/email_token_get_by_hash.repository.js';
import type { ConsumeRepository } from '../../repositories/email_token/email_token_consume.repository.js';
import type { UpdatePasswordRepository } from '../../repositories/user/user_update_password.repository.js';
import type { RevokeUserRepository } from '../../repositories/refresh_token/refresh_token_revoke_user.repository.js';
import { hashRefreshToken } from '../../helpers/refresh_token.js';
import { hashPassword } from '../../helpers/password.js';
import { passwordChangedEmail } from '../../helpers/email_messages.js';
import { sendEmailSafe } from '../../helpers/send_email_safe.js';

export class ResetAction {
  constructor(
    private readonly getByHash: GetByHashRepository,
    private readonly getUser: GetRepository,
    private readonly consumeRepository: ConsumeRepository,
    private readonly updatePassword: UpdatePasswordRepository,
    private readonly revokeUser: RevokeUserRepository,
    private readonly leakedPassword: LeakedPasswordPort,
    private readonly email: EmailPort,
  ) {}

  async execute(
    authPasswordResetSchema: AuthPasswordResetSchema,
    requestMeta: RequestMeta,
  ): Promise<void> {
    const token = await this.getByHash.execute(
      hashRefreshToken(authPasswordResetSchema.token),
    );
    if (
      !token ||
      token.props.purpose !== EmailTokenPurpose.PASSWORD_RESET ||
      !token.isUsable
    ) {
      throw new InvalidEmailTokenError();
    }
    if (await this.leakedPassword.isLeaked(authPasswordResetSchema.password)) {
      throw new LeakedPasswordError();
    }

    const ctx: RequestContext = {
      tenantId: token.props.tenantId,
      userId: token.props.userId,
      requestId: requestMeta.requestId,
      role: 'SYSTEM',
      locationScope: 'ALL',
      locationIds: [],
    };
    await this.updatePassword.execute(
      ctx,
      token.props.userId,
      await hashPassword(authPasswordResetSchema.password),
    );
    await this.consumeRepository.execute(ctx, token.props.id);
    await this.revokeUser.execute(ctx, token.props.userId);
    const loaded = await this.getUser.execute(ctx, token.props.userId);
    if (loaded) {
      await sendEmailSafe(this.email, {
        to: loaded.user.props.email,
        ...passwordChangedEmail(),
      });
    }
    await writeAuditLogSafe({
      tenantId: token.props.tenantId,
      actorUserId: token.props.userId,
      action: AuditAction.PASSWORD_RESET,
      resourceType: 'user',
      resourceId: token.props.userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });
  }
}
