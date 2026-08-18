import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type { EmailMessage, EmailPort } from '../../../modules/identity/types/ports/email.port.js';

export class SmtpEmailAdapter implements EmailPort {
  private readonly transport = nodemailer.createTransport(env.MAIL_DSN);

  async send(message: EmailMessage): Promise<void> {
    await this.transport.sendMail({
      from: env.MAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    logger.info({ subject: message.subject }, 'email_sent_smtp');
  }
}
