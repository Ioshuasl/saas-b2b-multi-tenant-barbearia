import { DuplicateEmailError } from '../../models/errors/duplicate_email.error.js';
import { LeakedPasswordError } from '../../models/errors/leaked_password.error.js';
import { User } from '../../models/user.model.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import { UserStatus } from '../../enum/user/user_status.enum.js';
import type { AuthSignupSchema } from '../../schemas/auth.schema.js';
import type { AuthSession } from '../../types/auth/auth_session.types.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { LeakedPasswordPort } from '../../types/ports/leaked_password.port.js';
import type { GetByEmailRepository } from '../../repositories/user/user_get_by_email.repository.js';
import type { SignupAction } from '../../actions/auth/auth_signup.action.js';
import type { LoginAction } from '../../actions/auth/auth_login.action.js';
import type { IssueVerifyAction } from '../../actions/auth/auth_verify_email_issue.action.js';
import { hashPassword } from '../../helpers/password.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';

export class SignupService {
  constructor(
    private readonly getByEmail: GetByEmailRepository,
    private readonly leakedPassword: LeakedPasswordPort,
    private readonly signupAction: SignupAction,
    private readonly loginAction: LoginAction,
    private readonly issueVerify: IssueVerifyAction,
  ) {}

  async execute(
    authSignupSchema: AuthSignupSchema,
    requestMeta: RequestMeta,
  ): Promise<AuthSession> {
    const existing = await this.getByEmail.execute(authSignupSchema.email);
    if (existing) {
      throw new DuplicateEmailError();
    }

    if (await this.leakedPassword.isLeaked(authSignupSchema.password)) {
      throw new LeakedPasswordError();
    }

    const passwordHash = await hashPassword(authSignupSchema.password);
    const created = await this.signupAction.execute(authSignupSchema, passwordHash);

    const user = new User({
      id: created.userId,
      tenantId: created.tenantId,
      email: created.email,
      passwordHash,
      name: created.name,
      phone: authSignupSchema.phone,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      lockedUntil: null,
      failedAttempts: 0,
    });

    const ctx: RequestContext = {
      tenantId: created.tenantId,
      userId: created.userId,
      requestId: requestMeta.requestId,
      role: UserRole.OWNER,
      locationScope: 'ALL',
      locationIds: [],
    };

    const session = await this.loginAction.execute(ctx, user, created.tenantSlug);
    await writeAuditLogSafe({
      tenantId: created.tenantId,
      actorUserId: created.userId,
      action: AuditAction.LOGIN,
      resourceType: 'session',
      resourceId: created.userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: { source: 'signup' },
    });
    await this.issueVerify.execute(ctx, created.email);
    return session;
  }
}
