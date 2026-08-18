import { CustomerUpdateData } from '@/packages/operacional/data/Customer/CustomerUpdateData';
import type { CustomerUpdateBody } from '@repo/contracts';

export async function CustomerUpdateService(id: string, customerSchema: CustomerUpdateBody) {
  return CustomerUpdateData(id, customerSchema);
}
