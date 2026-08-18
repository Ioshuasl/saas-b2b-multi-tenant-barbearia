import { env } from '../../config/env.js';
import type { EmailPort } from '../../../modules/identity/types/ports/email.port.js';
import { ResendEmailAdapter } from './resend.adapter.js';
import { SmtpEmailAdapter } from './smtp.adapter.js';

let singleton: EmailPort | undefined;

/** Produção com RESEND_API_KEY → Resend; caso contrário SMTP (Mailpit local). */
export function getEmailPort(): EmailPort {
  if (!singleton) {
    singleton =
      env.NODE_ENV === 'production' && env.RESEND_API_KEY
        ? new ResendEmailAdapter()
        : new SmtpEmailAdapter();
  }
  return singleton;
}
