import { apiClient } from '@/shared/api/api-client';
import { publicAppointmentPath } from '@/packages/public/helpers/PublicApiPath';
import type {
  PublicAppointmentRescheduled,
  PublicAppointmentTokenParams,
  PublicRescheduleBody,
} from '@repo/contracts';

export async function PublicAppointmentUpdateData(
  publicAppointmentTokenParams: PublicAppointmentTokenParams,
  publicRescheduleSchema: PublicRescheduleBody,
): Promise<PublicAppointmentRescheduled> {
  return apiClient.requestPublic(
    publicAppointmentPath(
      publicAppointmentTokenParams.tenantSlug,
      publicAppointmentTokenParams.locationSlug,
      publicAppointmentTokenParams.id,
    ),
    {
      method: 'PATCH',
      query: { token: publicAppointmentTokenParams.token },
      body: JSON.stringify(publicRescheduleSchema),
    },
  );
}
