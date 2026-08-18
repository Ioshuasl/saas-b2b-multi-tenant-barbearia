import { apiClient } from '@/shared/api/api-client';
import { publicAppointmentPath } from '@/packages/public/helpers/PublicApiPath';
import type { PublicAppointmentTokenParams, PublicCancelBody } from '@repo/contracts';

export async function PublicAppointmentDeleteData(
  publicAppointmentTokenParams: PublicAppointmentTokenParams,
  publicCancelSchema: PublicCancelBody = {},
): Promise<void> {
  await apiClient.requestPublic(
    publicAppointmentPath(
      publicAppointmentTokenParams.tenantSlug,
      publicAppointmentTokenParams.locationSlug,
      publicAppointmentTokenParams.id,
    ),
    {
      method: 'DELETE',
      query: { token: publicAppointmentTokenParams.token },
      body: JSON.stringify(publicCancelSchema),
    },
  );
}
