'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StaffCreateService } from '@/packages/admin/services/Staff/StaffCreateService';
import { StaffReplaceServicesService } from '@/packages/admin/services/Staff/StaffReplaceServicesService';
import type { StaffFormValues } from '@/packages/admin/types/Staff/StaffTypes';

export function useStaffCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: StaffFormValues) => {
      const created = await StaffCreateService(values);
      if (values.serviceIds.length) await StaffReplaceServicesService(created.id, values.serviceIds);
      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
