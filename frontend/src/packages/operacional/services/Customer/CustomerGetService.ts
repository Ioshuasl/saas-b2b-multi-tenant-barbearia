import { CustomerGetData } from '@/packages/operacional/data/Customer/CustomerGetData';

export async function CustomerGetService(id: string) {
  return CustomerGetData(id);
}
