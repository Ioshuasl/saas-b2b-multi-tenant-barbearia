import type { AuthPasswordResetSchema } from '../../schemas/auth.schema.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { ResetAction } from '../../actions/auth/auth_password_reset.action.js';

export class ResetService {
  constructor(private readonly resetAction: ResetAction) {}

  async execute(
    authPasswordResetSchema: AuthPasswordResetSchema,
    requestMeta: RequestMeta,
  ): Promise<void> {
    await this.resetAction.execute(authPasswordResetSchema, requestMeta);
  }
}
