import { CustomerCreateData } from '@/packages/operacional/data/Customer/CustomerCreateData';
import type { CustomerCreateBody } from '@repo/contracts';

export async function CustomerCreateService(customerSchema: CustomerCreateBody) {
  return CustomerCreateData(customerSchema);
}
