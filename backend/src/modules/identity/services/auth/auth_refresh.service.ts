import type { RefreshAction } from '../../actions/auth/auth_refresh.action.js';
import type { AuthSession } from '../../types/auth/auth_session.types.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';

export class RefreshService {
  constructor(private readonly refreshAction: RefreshAction) {}

  async execute(rawToken: string, requestMeta: RequestMeta): Promise<AuthSession> {
    return this.refreshAction.execute(rawToken, requestMeta);
  }
}
