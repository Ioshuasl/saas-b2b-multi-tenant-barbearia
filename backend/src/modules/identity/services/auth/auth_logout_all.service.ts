import type { LogoutAllAction } from '../../actions/auth/auth_logout_all.action.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';

export class LogoutAllService {
  constructor(private readonly logoutAllAction: LogoutAllAction) {}

  async execute(rawToken: string | undefined, requestMeta: RequestMeta): Promise<void> {
    await this.logoutAllAction.execute(rawToken, requestMeta);
  }
}
