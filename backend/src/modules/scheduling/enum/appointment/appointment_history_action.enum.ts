export const AppointmentHistoryAction = {
  CREATED: 'CREATED',
  RESCHEDULED: 'RESCHEDULED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  CANCELLED: 'CANCELLED',
} as const;

export type AppointmentHistoryActionName =
  (typeof AppointmentHistoryAction)[keyof typeof AppointmentHistoryAction];
