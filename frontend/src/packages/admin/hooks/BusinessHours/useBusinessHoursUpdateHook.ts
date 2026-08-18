'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessHoursUpdateService } from '@/packages/admin/services/BusinessHours/BusinessHoursUpdateService';
import type { BusinessHoursSlot } from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export function useBusinessHoursUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, slots }: { locationId: string; slots: BusinessHoursSlot[] }) =>
      BusinessHoursUpdateService(locationId, slots),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-hours'] }),
  });
}
