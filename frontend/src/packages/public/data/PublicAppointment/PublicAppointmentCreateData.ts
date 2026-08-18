import { apiClient } from '@/shared/api/api-client';
import { createIdempotencyKey } from '@/shared/helpers/IdempotencyKey';
import { publicLocationPath } from '@/packages/public/helpers/PublicApiPath';
import type { PublicAppointmentCreated, PublicBookBody, PublicSlugParams } from '@repo/contracts';

export async function PublicAppointmentCreateData(
  publicSlugParams: PublicSlugParams,
  publicBookSchema: PublicBookBody,
): Promise<PublicAppointmentCreated> {
  return apiClient.requestPublic(
    `${publicLocationPath(publicSlugParams.tenantSlug, publicSlugParams.locationSlug)}/appointments`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': createIdempotencyKey() },
      body: JSON.stringify(publicBookSchema),
    },
  );
}
