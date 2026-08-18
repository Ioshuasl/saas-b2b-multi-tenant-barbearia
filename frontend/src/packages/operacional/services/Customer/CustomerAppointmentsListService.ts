import { CustomerAppointmentsListData } from '@/packages/operacional/data/Customer/CustomerAppointmentsListData';

export async function CustomerAppointmentsListService(id: string) {
  return CustomerAppointmentsListData(id);
}
