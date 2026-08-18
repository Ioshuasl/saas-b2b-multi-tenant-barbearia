import type { EmailSendInput } from '../messaging.types.js';

export type EmailProvider = {
  send(input: EmailSendInput): Promise<void>;
};
