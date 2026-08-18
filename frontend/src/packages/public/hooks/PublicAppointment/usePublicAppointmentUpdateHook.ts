'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PublicAppointmentUpdateService } from '@/packages/public/services/PublicAppointment/PublicAppointmentUpdateService';
import type { PublicAppointmentTokenParams, PublicRescheduleBody } from '@repo/contracts';

export function usePublicAppointmentUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicAppointmentTokenParams,
      publicRescheduleSchema,
    }: {
      publicAppointmentTokenParams: PublicAppointmentTokenParams;
      publicRescheduleSchema: PublicRescheduleBody;
    }) => PublicAppointmentUpdateService(publicAppointmentTokenParams, publicRescheduleSchema),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['public-availability'] });
      await qc.invalidateQueries({ queryKey: ['public-appointment'] });
    },
  });
}
