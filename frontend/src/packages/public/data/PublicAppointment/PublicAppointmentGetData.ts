import { apiClient } from '@/shared/api/api-client';
import { publicAppointmentPath } from '@/packages/public/helpers/PublicApiPath';
import type { PublicAppointmentMasked, PublicAppointmentTokenParams } from '@repo/contracts';

export async function PublicAppointmentGetData(
  publicAppointmentTokenParams: PublicAppointmentTokenParams,
): Promise<PublicAppointmentMasked> {
  return apiClient.requestPublic(
    publicAppointmentPath(
      publicAppointmentTokenParams.tenantSlug,
      publicAppointmentTokenParams.locationSlug,
      publicAppointmentTokenParams.id,
    ),
    {
      method: 'GET',
      query: { token: publicAppointmentTokenParams.token },
    },
  );
}
