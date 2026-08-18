import { AppointmentCreateData } from '@/packages/operacional/data/Appointment/AppointmentCreateData';
import type { AppointmentCreateBody } from '@repo/contracts';

export async function AppointmentCreateService(appointmentSchema: AppointmentCreateBody) {
  return AppointmentCreateData(appointmentSchema);
}
