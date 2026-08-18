import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { EmailTokenPurpose } from '../../enum/auth/email_token_purpose.enum.js';
import type { EmailPort } from '../../types/ports/email.port.js';
import type { IssueRepository } from '../../repositories/email_token/email_token_issue.repository.js';
import { verifyEmailMessage } from '../../helpers/email_messages.js';
import { sendEmailSafe } from '../../helpers/send_email_safe.js';

const VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class IssueVerifyAction {
  constructor(
    private readonly issueRepository: IssueRepository,
    private readonly email: EmailPort,
  ) {}

  async execute(ctx: RequestContext, to: string): Promise<void> {
    const token = await this.issueRepository.execute(ctx, {
      userId: ctx.userId,
      purpose: EmailTokenPurpose.EMAIL_VERIFY,
      ttlMs: VERIFY_TTL_MS,
    });
    const message = verifyEmailMessage(token);
    await sendEmailSafe(this.email, { to, ...message });
  }
}
