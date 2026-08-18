'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TimeBlockCreateService } from '@/packages/admin/services/TimeBlock/TimeBlockCreateService';
import type { TimeBlockFormValues } from '@/packages/admin/types/TimeBlock/TimeBlockTypes';

export function useTimeBlockCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, values }: { locationId: string; values: TimeBlockFormValues }) =>
      TimeBlockCreateService(locationId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-blocks'] }),
  });
}
