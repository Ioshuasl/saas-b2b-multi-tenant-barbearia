export const QUEUE_NAMES = {
  PLATFORM: 'platform',
  MESSAGING: 'messaging',
} as const;

export const JOB_NAMES = {
  DISPATCH_OUTBOX: 'dispatch-outbox',
  PROCESS_OUTBOX_EVENT: 'process-outbox-event',
  SEND_NOTIFICATION: 'send-notification',
  SCHEDULE_REMINDERS: 'schedule-reminders',
  CANCEL_REMINDERS: 'cancel-reminders',
} as const;

export const OUTBOX_MAX_ATTEMPTS = 5;

export type ProcessOutboxEventPayload = {
  tenantId: string;
  requestId: string;
  outboxEventId: string;
  eventName: string;
  payload: Record<string, unknown>;
};

export type SendNotificationPayload = {
  tenantId: string;
  requestId: string;
  appointmentId: string;
  templateKey: string;
  notifyCustomer?: boolean;
  cancelLink?: string;
  cancelToken?: string;
};

export type ScheduleRemindersPayload = {
  tenantId: string;
  requestId: string;
  appointmentId: string;
  startsAt: string;
};

export type CancelRemindersPayload = {
  tenantId: string;
  requestId: string;
  appointmentId: string;
};

export function workerCtx(payload: { tenantId: string; requestId: string }) {
  return {
    tenantId: payload.tenantId,
    userId: 'worker',
    requestId: payload.requestId,
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
}

export function sendNotificationJobId(
  tenantId: string,
  appointmentId: string,
  templateKey: string,
): string {
  return `send-${tenantId}-${appointmentId}-${templateKey}`;
}

export function reminderJobId(
  tenantId: string,
  appointmentId: string,
  templateKey: string,
): string {
  return `reminder-${tenantId}-${appointmentId}-${templateKey}`;
}
