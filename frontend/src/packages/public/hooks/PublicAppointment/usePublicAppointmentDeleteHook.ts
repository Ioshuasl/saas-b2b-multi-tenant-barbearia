'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PublicAppointmentDeleteService } from '@/packages/public/services/PublicAppointment/PublicAppointmentDeleteService';
import type { PublicAppointmentTokenParams, PublicCancelBody } from '@repo/contracts';

export function usePublicAppointmentDeleteHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicAppointmentTokenParams,
      publicCancelSchema,
    }: {
      publicAppointmentTokenParams: PublicAppointmentTokenParams;
      publicCancelSchema?: PublicCancelBody;
    }) => PublicAppointmentDeleteService(publicAppointmentTokenParams, publicCancelSchema),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['public-availability'] });
      await qc.invalidateQueries({ queryKey: ['public-appointment'] });
    },
  });
}
