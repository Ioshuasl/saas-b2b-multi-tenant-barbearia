import { TenantSlugAvailableData } from '@/packages/admin/data/Tenant/TenantSlugAvailableData';

export async function TenantSlugAvailableService(slug: string) {
  return TenantSlugAvailableData(slug);
}
