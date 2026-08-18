import { TenantGetData } from '@/packages/admin/data/Tenant/TenantGetData';

export async function TenantGetService() {
  return TenantGetData();
}
