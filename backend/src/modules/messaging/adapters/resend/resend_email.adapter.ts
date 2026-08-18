import { getEmailPort } from '../../../../shared/integrations/email/index.js';
import type { EmailProvider } from '../../types/ports/email_provider.port.js';
import type { EmailSendInput } from '../../types/messaging.types.js';

export class ResendEmailAdapter implements EmailProvider {
  async send(input: EmailSendInput): Promise<void> {
    await getEmailPort().send({
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }
}
