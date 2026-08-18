import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { AppError } from '../../../../shared/domain/errors.js';
import type { GetByHashRepository } from '../../repositories/refresh_token/refresh_token_get_by_hash.repository.js';
import type { RevokeUserRepository } from '../../repositories/refresh_token/refresh_token_revoke_user.repository.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import { hashRefreshToken } from '../../helpers/refresh_token.js';

export class LogoutAllAction {
  constructor(
    private readonly getByHash: GetByHashRepository,
    private readonly revokeUser: RevokeUserRepository,
  ) {}

  async execute(rawToken: string | undefined, requestMeta: RequestMeta): Promise<void> {
    if (!rawToken) {
      throw new AppError('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.', 401);
    }
    const token = await this.getByHash.execute(hashRefreshToken(rawToken));
    if (!token) {
      throw new AppError('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.', 401);
    }

    const ctx: RequestContext = {
      tenantId: token.props.tenantId,
      userId: token.props.userId,
      requestId: requestMeta.requestId,
      role: 'SYSTEM',
      locationScope: 'ALL',
      locationIds: [],
    };

    await this.revokeUser.execute(ctx, token.props.userId);
    await writeAuditLogSafe({
      tenantId: token.props.tenantId,
      actorUserId: token.props.userId,
      action: AuditAction.LOGOUT_ALL,
      resourceType: 'session',
      resourceId: token.props.userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });
  }
}
