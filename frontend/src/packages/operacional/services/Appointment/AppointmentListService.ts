import { AppointmentListData } from '@/packages/operacional/data/Appointment/AppointmentListData';
import type { AppointmentListQuery } from '@repo/contracts';

export async function AppointmentListService(query: AppointmentListQuery) {
  return AppointmentListData(query);
}
