export const AppointmentSource = {
  PUBLIC_PAGE: 'PUBLIC_PAGE',
  PANEL: 'PANEL',
  PHONE: 'PHONE',
  WALKIN: 'WALKIN',
} as const;

export type AppointmentSourceName = (typeof AppointmentSource)[keyof typeof AppointmentSource];

export const APPOINTMENT_SOURCES = Object.values(AppointmentSource) as AppointmentSourceName[];
