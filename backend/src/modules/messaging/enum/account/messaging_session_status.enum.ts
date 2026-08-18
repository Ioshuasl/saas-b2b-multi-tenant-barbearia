export const MessagingSessionStatus = {
  PENDING: 'PENDING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
  DISCONNECTED: 'DISCONNECTED',
} as const;

export type MessagingSessionStatusName =
  (typeof MessagingSessionStatus)[keyof typeof MessagingSessionStatus];

export const MessagingChannel = {
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
} as const;

export type MessagingChannelName = (typeof MessagingChannel)[keyof typeof MessagingChannel];

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
} as const;

export type NotificationStatusName =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const MessageTemplateKey = {
  APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
  REMINDER_24H: 'reminder_24h',
  REMINDER_2H: 'reminder_2h',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
} as const;

export type MessageTemplateKeyName =
  (typeof MessageTemplateKey)[keyof typeof MessageTemplateKey];
