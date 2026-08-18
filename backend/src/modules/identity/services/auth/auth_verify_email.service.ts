import type { AuthVerifyEmailSchema } from '../../schemas/auth.schema.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { VerifyEmailAction } from '../../actions/auth/auth_verify_email.action.js';

export class VerifyEmailService {
  constructor(private readonly verifyAction: VerifyEmailAction) {}

  async execute(
    authVerifyEmailSchema: AuthVerifyEmailSchema,
    requestMeta: RequestMeta,
  ): Promise<void> {
    await this.verifyAction.execute(authVerifyEmailSchema.token, requestMeta);
  }
}
