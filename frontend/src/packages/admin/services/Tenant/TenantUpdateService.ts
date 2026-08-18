import { TenantUpdateData } from '@/packages/admin/data/Tenant/TenantUpdateData';
import type { TenantFormValues } from '@/packages/admin/types/Tenant/TenantTypes';

export async function TenantUpdateService(values: TenantFormValues) {
  return TenantUpdateData(values);
}
