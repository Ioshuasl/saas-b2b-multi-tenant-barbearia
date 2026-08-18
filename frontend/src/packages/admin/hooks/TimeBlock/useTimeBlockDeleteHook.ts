'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TimeBlockDeleteService } from '@/packages/admin/services/TimeBlock/TimeBlockDeleteService';

export function useTimeBlockDeleteHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: TimeBlockDeleteService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-blocks'] }),
  });
}
