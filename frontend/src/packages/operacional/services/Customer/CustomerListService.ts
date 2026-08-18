import { CustomerListData } from '@/packages/operacional/data/Customer/CustomerListData';
import type { CustomerListQuery } from '@repo/contracts';

export async function CustomerListService(query: CustomerListQuery = {}) {
  return CustomerListData(query);
}
