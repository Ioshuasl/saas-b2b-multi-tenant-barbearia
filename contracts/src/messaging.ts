import { z } from 'zod';

export const MessagingSessionStatus = {
  PENDING: 'PENDING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
  DISCONNECTED: 'DISCONNECTED',
} as const;

export type MessagingSessionStatusName =
  (typeof MessagingSessionStatus)[keyof typeof MessagingSessionStatus];

export const MESSAGING_SESSION_STATUSES = [
  MessagingSessionStatus.PENDING,
  MessagingSessionStatus.CONNECTED,
  MessagingSessionStatus.ERROR,
  MessagingSessionStatus.DISCONNECTED,
] as const;

export const messagingSessionStatusSchema = z.enum(MESSAGING_SESSION_STATUSES);

export const MessagingChannel = {
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
} as const;

export type MessagingChannelName = (typeof MessagingChannel)[keyof typeof MessagingChannel];

export const MESSAGING_CHANNELS = [MessagingChannel.WHATSAPP, MessagingChannel.EMAIL] as const;

export const messagingChannelSchema = z.enum(MESSAGING_CHANNELS);

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
} as const;

export type NotificationStatusName = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const NOTIFICATION_STATUSES = [
  NotificationStatus.PENDING,
  NotificationStatus.SENT,
  NotificationStatus.FAILED,
  NotificationStatus.CANCELED,
] as const;

export const notificationStatusSchema = z.enum(NOTIFICATION_STATUSES);

export type MessagingAccountSummary = {
  id: string;
  tenantId: string;
  sessionName: string;
  displayPhone: string | null;
  status: MessagingSessionStatusName;
  killSwitch: boolean;
  riskAcceptedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessagingAccountConnectResult = MessagingAccountSummary & {
  qr?: string | null;
  pairingCode?: string | null;
};

export type MessagingQrResult = {
  status: MessagingSessionStatusName;
  displayPhone: string | null;
  qr?: string | null;
  pairingCode?: string | null;
};

export const messagingAccountCreateSchema = z.object({
  riskAccepted: z.boolean(),
});

export type MessagingAccountCreateBody = z.infer<typeof messagingAccountCreateSchema>;

export type NotificationSummary = {
  id: string;
  tenantId: string;
  locationId: string | null;
  appointmentId: string | null;
  customerId: string | null;
  channel: MessagingChannelName;
  provider: string;
  templateKey: string;
  recipient: string;
  scheduledFor: string | null;
  sentAt: string | null;
  status: NotificationStatusName;
  providerMessageId: string | null;
  error: string | null;
  createdAt: string;
};
