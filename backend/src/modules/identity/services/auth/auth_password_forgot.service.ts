import type { AuthPasswordForgotSchema } from '../../schemas/auth.schema.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { GetByEmailRepository } from '../../repositories/user/user_get_by_email.repository.js';
import type { ForgotAction } from '../../actions/auth/auth_password_forgot.action.js';
import { hashPassword } from '../../helpers/password.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';

export class ForgotService {
  constructor(
    private readonly getByEmail: GetByEmailRepository,
    private readonly forgotAction: ForgotAction,
  ) {}

  async execute(
    authPasswordForgotSchema: AuthPasswordForgotSchema,
    requestMeta: RequestMeta,
  ): Promise<void> {
    const found = await this.getByEmail.execute(authPasswordForgotSchema.email);
    if (!found || !found.user.isActive) {
      await hashPassword('not-a-real-password');
      return;
    }
    const ctx: RequestContext = {
      tenantId: found.user.props.tenantId,
      userId: found.user.props.id,
      requestId: requestMeta.requestId,
      role: found.user.props.role,
      locationScope: found.user.props.role === UserRole.OWNER ? 'ALL' : 'RESTRICTED',
      locationIds: [],
    };
    await this.forgotAction.execute(ctx, found.user.props.email);
  }
}
