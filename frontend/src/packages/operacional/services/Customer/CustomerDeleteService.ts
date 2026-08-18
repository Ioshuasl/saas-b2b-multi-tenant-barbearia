import { CustomerDeleteData } from '@/packages/operacional/data/Customer/CustomerDeleteData';

export async function CustomerDeleteService(id: string) {
  return CustomerDeleteData(id);
}
