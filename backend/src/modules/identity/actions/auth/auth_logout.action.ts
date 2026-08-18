import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import type { GetByHashRepository } from '../../repositories/refresh_token/refresh_token_get_by_hash.repository.js';
import type { ConsumeRepository } from '../../repositories/refresh_token/refresh_token_consume.repository.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import { hashRefreshToken } from '../../helpers/refresh_token.js';

export class LogoutAction {
  constructor(
    private readonly getByHash: GetByHashRepository,
    private readonly consumeRepository: ConsumeRepository,
  ) {}

  async execute(rawToken: string | undefined, requestMeta: RequestMeta): Promise<void> {
    if (!rawToken) return;
    const token = await this.getByHash.execute(hashRefreshToken(rawToken));
    if (!token) return;

    const ctx: RequestContext = {
      tenantId: token.props.tenantId,
      userId: token.props.userId,
      requestId: requestMeta.requestId,
      role: 'SYSTEM',
      locationScope: 'ALL',
      locationIds: [],
    };

    if (token.isUsable) {
      await this.consumeRepository.execute(ctx, token.props.id);
    }

    await writeAuditLogSafe({
      tenantId: token.props.tenantId,
      actorUserId: token.props.userId,
      action: AuditAction.LOGOUT,
      resourceType: 'session',
      resourceId: token.props.userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });
  }
}
