'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StaffUpdateService } from '@/packages/admin/services/Staff/StaffUpdateService';
import { StaffReplaceLocationsService } from '@/packages/admin/services/Staff/StaffReplaceLocationsService';
import { StaffReplaceServicesService } from '@/packages/admin/services/Staff/StaffReplaceServicesService';
import type { StaffFormValues } from '@/packages/admin/types/Staff/StaffTypes';

export function useStaffUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: StaffFormValues }) => {
      await StaffUpdateService(id, values);
      if (values.locationIds.length) await StaffReplaceLocationsService(id, values.locationIds);
      await StaffReplaceServicesService(id, values.serviceIds);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
