import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { signAccessToken } from '../../../../shared/auth/jwt.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { RefreshReuseError } from '../../models/errors/refresh_reuse.error.js';
import type { GetByHashRepository } from '../../repositories/refresh_token/refresh_token_get_by_hash.repository.js';
import type { RotateRepository } from '../../repositories/refresh_token/refresh_token_rotate.repository.js';
import type { RevokeFamilyRepository } from '../../repositories/refresh_token/refresh_token_revoke_family.repository.js';
import type { GetRepository } from '../../repositories/user/user_get.repository.js';
import type { AuthSession } from '../../types/auth/auth_session.types.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import { hashRefreshToken } from '../../helpers/refresh_token.js';
import { UserRole } from '../../enum/user/user_role.enum.js';

export class RefreshAction {
  constructor(
    private readonly getByHash: GetByHashRepository,
    private readonly rotateRepository: RotateRepository,
    private readonly revokeFamily: RevokeFamilyRepository,
    private readonly getUser: GetRepository,
  ) {}

  async execute(rawToken: string, requestMeta: RequestMeta): Promise<AuthSession> {
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

    if (token.isReuse) {
      await this.revokeFamily.execute(ctx, token.props.familyId);
      await writeAuditLogSafe({
        tenantId: token.props.tenantId,
        actorUserId: token.props.userId,
        action: AuditAction.REFRESH_REUSE,
        resourceType: 'refresh_token_family',
        resourceId: token.props.familyId,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      });
      throw new RefreshReuseError();
    }

    if (!token.isUsable) {
      throw new AppError('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.', 401);
    }

    const loaded = await this.getUser.execute(ctx, token.props.userId);
    if (!loaded || !loaded.user.canAuthenticate()) {
      throw new AppError('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.', 401);
    }

    ctx.role = loaded.user.props.role;
    ctx.locationScope = loaded.user.props.role === UserRole.OWNER ? 'ALL' : 'RESTRICTED';

    const refreshToken = await this.rotateRepository.execute(ctx, {
      currentId: token.props.id,
      userId: token.props.userId,
      familyId: token.props.familyId,
    });
    const accessToken = await signAccessToken({
      userId: loaded.user.props.id,
      tenantId: loaded.user.props.tenantId,
      role: loaded.user.props.role,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: loaded.user.props.id,
        email: loaded.user.props.email,
        name: loaded.user.props.name,
        role: loaded.user.props.role,
        tenantId: loaded.user.props.tenantId,
        tenantSlug: loaded.tenantSlug,
      },
    };
  }
}
