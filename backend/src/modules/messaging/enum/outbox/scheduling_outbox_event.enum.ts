export const SchedulingOutboxEvent = {
  APPOINTMENT_SCHEDULED: 'scheduling.appointment_scheduled',
  APPOINTMENT_RESCHEDULED: 'scheduling.appointment_rescheduled',
  APPOINTMENT_CANCELLED: 'scheduling.appointment_cancelled',
} as const;

export type SchedulingOutboxEventName =
  (typeof SchedulingOutboxEvent)[keyof typeof SchedulingOutboxEvent];
