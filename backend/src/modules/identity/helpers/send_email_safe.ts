import { logger } from '../../../shared/config/logger.js';
import type { EmailPort } from '../types/ports/email.port.js';

export async function sendEmailSafe(
  email: EmailPort,
  message: { to: string; subject: string; text: string; html?: string },
): Promise<void> {
  try {
    await email.send(message);
  } catch (err) {
    logger.error({ err, subject: message.subject }, 'email_send_failed');
  }
}
