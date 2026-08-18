import { AppointmentHistoryListData } from '@/packages/operacional/data/Appointment/AppointmentHistoryListData';

export async function AppointmentHistoryListService(id: string) {
  return AppointmentHistoryListData(id);
}
