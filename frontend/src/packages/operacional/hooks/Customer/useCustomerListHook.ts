'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { CustomerListService } from '@/packages/operacional/services/Customer/CustomerListService';
import type { CustomerListQuery } from '@repo/contracts';

export function useCustomerListHook(
  query: Omit<CustomerListQuery, 'cursor'> = {},
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ['customers', 'list', query],
    queryFn: ({ pageParam }) => CustomerListService({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}
