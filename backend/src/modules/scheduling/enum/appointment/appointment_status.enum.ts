export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_SERVICE: 'IN_SERVICE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatusName =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const ACTIVE_APPOINTMENT_STATUSES: readonly AppointmentStatusName[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_SERVICE,
];

export const TERMINAL_APPOINTMENT_STATUSES: readonly AppointmentStatusName[] = [
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];
