'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PublicAppointmentCreateService } from '@/packages/public/services/PublicAppointment/PublicAppointmentCreateService';
import type { PublicBookBody, PublicSlugParams } from '@repo/contracts';

export function usePublicAppointmentCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicSlugParams,
      publicBookSchema,
    }: {
      publicSlugParams: PublicSlugParams;
      publicBookSchema: PublicBookBody;
    }) => PublicAppointmentCreateService(publicSlugParams, publicBookSchema),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['public-availability'] });
      await qc.invalidateQueries({ queryKey: ['public-appointment'] });
    },
  });
}
