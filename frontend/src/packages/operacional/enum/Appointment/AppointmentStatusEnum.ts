import type { AppointmentStatusName } from '@repo/contracts';

export {
  APPOINTMENT_STATUSES,
  AppointmentStatus,
  type AppointmentStatusName,
} from '@repo/contracts';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatusName, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_SERVICE: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'No-show',
};
