import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { ResendAction } from '../../actions/invitation/invitation_resend.action.js';

export class ResendService {
  constructor(private readonly resendAction: ResendAction) {}

  async execute(
    ctx: RequestContext,
    invitationId: string,
    requestMeta: RequestMeta,
  ): Promise<void> {
    await this.resendAction.execute(ctx, invitationId, requestMeta);
  }
}
