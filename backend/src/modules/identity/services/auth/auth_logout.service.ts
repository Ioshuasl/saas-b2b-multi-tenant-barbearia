import type { LogoutAction } from '../../actions/auth/auth_logout.action.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';

export class LogoutService {
  constructor(private readonly logoutAction: LogoutAction) {}

  async execute(rawToken: string | undefined, requestMeta: RequestMeta): Promise<void> {
    await this.logoutAction.execute(rawToken, requestMeta);
  }
}
