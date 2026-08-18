import {
  AppointmentSource,
  type AppointmentSourceName,
} from '@repo/contracts';

export {
  APPOINTMENT_SOURCES,
  AppointmentSource,
  type AppointmentSourceName,
} from '@repo/contracts';

export const PANEL_APPOINTMENT_SOURCES = [
  AppointmentSource.PANEL,
  AppointmentSource.PHONE,
  AppointmentSource.WALKIN,
] as const;

export const APPOINTMENT_SOURCE_LABELS: Record<AppointmentSourceName, string> = {
  PUBLIC_PAGE: 'Página pública',
  PANEL: 'Painel',
  PHONE: 'Telefone',
  WALKIN: 'Presencial',
};
