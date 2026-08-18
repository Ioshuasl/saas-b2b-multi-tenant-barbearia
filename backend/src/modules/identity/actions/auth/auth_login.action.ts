import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { signAccessToken } from '../../../../shared/auth/jwt.js';
import type { User } from '../../models/user.model.js';
import type { LoginRepository } from '../../repositories/auth/auth_login.repository.js';
import type { AuthSession } from '../../types/auth/auth_session.types.js';

export class LoginAction {
  constructor(private readonly loginRepository: LoginRepository) {}

  async execute(
    ctx: RequestContext,
    user: User,
    tenantSlug: string,
  ): Promise<AuthSession> {
    const issued = await this.loginRepository.execute(ctx, user.props.id);
    const accessToken = await signAccessToken({
      userId: user.props.id,
      tenantId: user.props.tenantId,
      role: user.props.role,
    });
    return {
      accessToken,
      refreshToken: issued.refreshToken,
      user: {
        id: user.props.id,
        email: user.props.email,
        name: user.props.name,
        role: user.props.role,
        tenantId: user.props.tenantId,
        tenantSlug,
      },
    };
  }
}
