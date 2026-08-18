'use client';

import { useQuery } from '@tanstack/react-query';
import { CustomerAppointmentsListService } from '@/packages/operacional/services/Customer/CustomerAppointmentsListService';

export function useCustomerAppointmentsListHook(id: string | null) {
  return useQuery({
    queryKey: ['customers', 'appointments', id],
    queryFn: () => CustomerAppointmentsListService(id as string),
    enabled: Boolean(id),
  });
}
