import { CustomerCheckDuplicateData } from '@/packages/operacional/data/Customer/CustomerCheckDuplicateData';

export async function CustomerCheckDuplicateService(phone: string) {
  return CustomerCheckDuplicateData(phone);
}
