import { apiClient } from '@/shared/api/api-client';
import { publicLocationPath } from '@/packages/public/helpers/PublicApiPath';
import type { AvailabilityResult, PublicAvailabilityListQuery } from '@repo/contracts';

export async function PublicAvailabilityListData(
  query: PublicAvailabilityListQuery,
): Promise<AvailabilityResult> {
  return apiClient.requestPublic(`${publicLocationPath(query.tenantSlug, query.locationSlug)}/availability`, {
    method: 'GET',
    query: {
      serviceIds: query.serviceIds.join(','),
      staffId: query.staffId,
      from: query.from,
      to: query.to,
    },
  });
}
