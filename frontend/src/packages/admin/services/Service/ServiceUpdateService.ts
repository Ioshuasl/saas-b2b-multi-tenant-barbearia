import { ServiceUpdateData } from '@/packages/admin/data/Service/ServiceUpdateData';
import type { ServiceFormValues } from '@/packages/admin/types/Service/ServiceTypes';

export async function ServiceUpdateService(id: string, values: ServiceFormValues) {
  return ServiceUpdateData(id, values);
}
