'use client';

import { useQuery } from '@tanstack/react-query';
import { PublicAppointmentGetService } from '@/packages/public/services/PublicAppointment/PublicAppointmentGetService';
import type { PublicAppointmentTokenParams } from '@repo/contracts';

export function usePublicAppointmentGetHook(
  publicAppointmentTokenParams: PublicAppointmentTokenParams | null,
) {
  return useQuery({
    queryKey: [
      'public-appointment',
      'get',
      publicAppointmentTokenParams?.tenantSlug,
      publicAppointmentTokenParams?.locationSlug,
      publicAppointmentTokenParams?.id,
      publicAppointmentTokenParams?.token,
    ],
    queryFn: () =>
      PublicAppointmentGetService(publicAppointmentTokenParams as PublicAppointmentTokenParams),
    enabled: Boolean(
      publicAppointmentTokenParams?.tenantSlug &&
        publicAppointmentTokenParams.locationSlug &&
        publicAppointmentTokenParams.id &&
        publicAppointmentTokenParams.token,
    ),
  });
}
