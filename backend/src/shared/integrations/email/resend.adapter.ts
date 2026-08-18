import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type { EmailMessage, EmailPort } from '../../../modules/identity/types/ports/email.port.js';

export class ResendEmailAdapter implements EmailPort {
  async send(message: EmailMessage): Promise<void> {
    const key = env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY ausente.');
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend HTTP ${response.status}: ${body}`);
    }
    logger.info({ subject: message.subject }, 'email_sent_resend');
  }
}
