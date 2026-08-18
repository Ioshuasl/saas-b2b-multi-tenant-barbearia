import { PublicTenantGetData } from '@/packages/public/data/PublicTenant/PublicTenantGetData';

export async function PublicTenantGetService(tenantSlug: string) {
  return PublicTenantGetData(tenantSlug);
}
