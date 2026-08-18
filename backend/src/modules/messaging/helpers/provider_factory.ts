import { env } from '../../../shared/config/env.js';
import { FakeMessagingAdapter } from '../adapters/fake/fake_messaging.adapter.js';
import { WahaMessagingAdapter } from '../adapters/waha/waha_messaging.adapter.js';
import { ResendEmailAdapter } from '../adapters/resend/resend_email.adapter.js';
import type { MessagingProvider } from '../types/ports/messaging_provider.port.js';
import type { EmailProvider } from '../types/ports/email_provider.port.js';

let messagingSingleton: MessagingProvider | undefined;
let emailSingleton: EmailProvider | undefined;

export function getMessagingProvider(): MessagingProvider {
  if (!messagingSingleton) {
    messagingSingleton =
      env.MESSAGING_PROVIDER === 'waha' ? new WahaMessagingAdapter() : new FakeMessagingAdapter();
  }
  return messagingSingleton;
}

export function getEmailProvider(): EmailProvider {
  if (!emailSingleton) {
    emailSingleton = new ResendEmailAdapter();
  }
  return emailSingleton;
}

/** Permite injetar mocks em testes. */
export function resetMessagingProvidersForTests(): void {
  messagingSingleton = undefined;
  emailSingleton = undefined;
}
