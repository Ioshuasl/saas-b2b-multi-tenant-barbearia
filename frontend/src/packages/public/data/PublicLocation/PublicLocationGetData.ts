import { apiClient } from '@/shared/api/api-client';
import { publicLocationPath } from '@/packages/public/helpers/PublicApiPath';
import type { PublicLocationDetail, PublicSlugParams } from '@repo/contracts';

export async function PublicLocationGetData(
  publicSlugParams: PublicSlugParams,
): Promise<PublicLocationDetail> {
  return apiClient.requestPublic(
    publicLocationPath(publicSlugParams.tenantSlug, publicSlugParams.locationSlug),
  );
}
