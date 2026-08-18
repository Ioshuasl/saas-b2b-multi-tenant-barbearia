import { AppointmentStatusData } from '@/packages/operacional/data/Appointment/AppointmentStatusData';
import type { AppointmentStatusBody } from '@repo/contracts';

export async function AppointmentStatusService(id: string, appointmentSchema: AppointmentStatusBody) {
  return AppointmentStatusData(id, appointmentSchema);
}
