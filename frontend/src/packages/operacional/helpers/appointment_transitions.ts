import { AppointmentStatus, type AppointmentStatusName } from '@repo/contracts';

const ALLOWED: Record<AppointmentStatusName, readonly AppointmentStatusName[]> = {
  [AppointmentStatus.SCHEDULED]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.IN_SERVICE,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.IN_SERVICE]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

export function nextStatusActions(status: AppointmentStatusName): AppointmentStatusName[] {
  return [...ALLOWED[status]];
}
