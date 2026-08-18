import { AppointmentGetData } from '@/packages/operacional/data/Appointment/AppointmentGetData';

export async function AppointmentGetService(id: string) {
  return AppointmentGetData(id);
}
