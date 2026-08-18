import { apiClient } from '@/shared/api/api-client';
import { publicTenantPath } from '@/packages/public/helpers/PublicApiPath';
import type { PublicTenant } from '@repo/contracts';

export async function PublicTenantGetData(tenantSlug: string): Promise<PublicTenant> {
  return apiClient.requestPublic(publicTenantPath(tenantSlug));
}
