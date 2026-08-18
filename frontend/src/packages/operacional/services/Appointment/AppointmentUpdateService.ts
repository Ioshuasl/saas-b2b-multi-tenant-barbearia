import { AppointmentUpdateData } from '@/packages/operacional/data/Appointment/AppointmentUpdateData';
import type { AppointmentUpdateBody } from '@repo/contracts';

export async function AppointmentUpdateService(id: string, appointmentSchema: AppointmentUpdateBody) {
  return AppointmentUpdateData(id, appointmentSchema);
}
