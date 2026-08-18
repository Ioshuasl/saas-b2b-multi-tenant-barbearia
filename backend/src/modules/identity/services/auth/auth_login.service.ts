import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { InvalidCredentialsError } from '../../models/errors/invalid_credentials.error.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import type { AuthLoginSchema } from '../../schemas/auth.schema.js';
import type { AuthSession } from '../../types/auth/auth_session.types.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { GetByEmailRepository } from '../../repositories/user/user_get_by_email.repository.js';
import type { RecordFailureRepository } from '../../repositories/user/user_record_failure.repository.js';
import type { LoginAction } from '../../actions/auth/auth_login.action.js';
import { verifyPasswordConstantTime } from '../../helpers/password.js';
import {
  assertLoginNotRateLimited,
  clearLoginFailures,
  recordLoginFailure,
} from '../../helpers/login_rate_limit.js';

export class LoginService {
  constructor(
    private readonly getByEmail: GetByEmailRepository,
    private readonly recordFailure: RecordFailureRepository,
    private readonly loginAction: LoginAction,
  ) {}

  async execute(
    authLoginSchema: AuthLoginSchema,
    requestMeta: RequestMeta,
  ): Promise<AuthSession> {
    const ip = requestMeta.ipAddress ?? 'unknown';
    assertLoginNotRateLimited(ip, authLoginSchema.email);

    const found = await this.getByEmail.execute(authLoginSchema.email);
    const passwordOk = await verifyPasswordConstantTime(
      found?.user.props.passwordHash ?? null,
      authLoginSchema.password,
    );

    if (!found || !passwordOk || !found.user.canAuthenticate()) {
      recordLoginFailure(ip, authLoginSchema.email);
      if (found) {
        const ctx = ctxOf(found.user.props.tenantId, found.user.props.id, requestMeta.requestId);
        await this.recordFailure.execute(ctx, found.user.props.id, found.user.props.failedAttempts);
        await writeAuditLogSafe({
          tenantId: found.user.props.tenantId,
          actorUserId: found.user.props.id,
          action: AuditAction.LOGIN_FAILED,
          resourceType: 'session',
          resourceId: found.user.props.id,
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
        });
      }
      throw new InvalidCredentialsError();
    }

    clearLoginFailures(ip, authLoginSchema.email);
    const ctx = ctxOf(found.user.props.tenantId, found.user.props.id, requestMeta.requestId);
    ctx.role = found.user.props.role;
    ctx.locationScope = found.user.props.role === UserRole.OWNER ? 'ALL' : 'RESTRICTED';

    const session = await this.loginAction.execute(ctx, found.user, found.tenantSlug);
    await writeAuditLogSafe({
      tenantId: found.user.props.tenantId,
      actorUserId: found.user.props.id,
      action: AuditAction.LOGIN,
      resourceType: 'session',
      resourceId: found.user.props.id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });
    return session;
  }
}

function ctxOf(tenantId: string, userId: string, requestId: string): RequestContext {
  return {
    tenantId,
    userId,
    requestId,
    role: UserRole.OWNER,
    locationScope: 'ALL',
    locationIds: [],
  };
}
