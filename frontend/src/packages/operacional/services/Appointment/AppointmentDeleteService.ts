import { AppointmentDeleteData } from '@/packages/operacional/data/Appointment/AppointmentDeleteData';
import type { AppointmentCancelBody } from '@repo/contracts';

export async function AppointmentDeleteService(id: string, appointmentSchema: AppointmentCancelBody) {
  return AppointmentDeleteData(id, appointmentSchema);
}
