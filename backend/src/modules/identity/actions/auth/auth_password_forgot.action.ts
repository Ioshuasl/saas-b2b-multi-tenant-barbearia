import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { EmailTokenPurpose } from '../../enum/auth/email_token_purpose.enum.js';
import type { EmailPort } from '../../types/ports/email.port.js';
import type { IssueRepository } from '../../repositories/email_token/email_token_issue.repository.js';
import { resetPasswordEmail } from '../../helpers/email_messages.js';
import { sendEmailSafe } from '../../helpers/send_email_safe.js';

const RESET_TTL_MS = 60 * 60 * 1000;

export class ForgotAction {
  constructor(
    private readonly issueRepository: IssueRepository,
    private readonly email: EmailPort,
  ) {}

  async execute(ctx: RequestContext, email: string): Promise<void> {
    const token = await this.issueRepository.execute(ctx, {
      userId: ctx.userId,
      purpose: EmailTokenPurpose.PASSWORD_RESET,
      ttlMs: RESET_TTL_MS,
    });
    const message = resetPasswordEmail(token);
    await sendEmailSafe(this.email, { to: email, ...message });
  }
}
