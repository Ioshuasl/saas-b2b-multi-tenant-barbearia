import { ServiceCreateData } from '@/packages/admin/data/Service/ServiceCreateData';
import type { ServiceFormValues } from '@/packages/admin/types/Service/ServiceTypes';

export async function ServiceCreateService(values: ServiceFormValues) {
  return ServiceCreateData(values);
}
