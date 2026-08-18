import type {
  MessagingAccountConnectResult,
  MessagingAccountSummary,
  MessagingQrResult,
} from '@repo/contracts';

export type { MessagingAccountSummary, MessagingAccountConnectResult, MessagingQrResult };

export type MessagingSessionSnapshot = {
  status: string;
  displayPhone?: string | null;
  qr?: string | null;
  pairingCode?: string | null;
};

export type MessagingSendInput = {
  sessionName: string;
  toE164: string;
  body: string;
};

export type MessagingSendResult = {
  providerMessageId: string;
};

export type EmailSendInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type WahaWebhookPayload = {
  id?: string;
  event?: string;
  session?: string;
  payload?: Record<string, unknown>;
  timestamp?: number;
};

export type WhatsappAccountLookup = {
  tenantId: string;
  accountId: string;
};
