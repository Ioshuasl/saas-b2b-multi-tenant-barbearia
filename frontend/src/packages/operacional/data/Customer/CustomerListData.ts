import { apiClient } from '@/shared/api/api-client';
import type { CustomerListQuery, CustomerListResult, CustomerSummary } from '@repo/contracts';

export async function CustomerListData(query: CustomerListQuery = {}): Promise<CustomerListResult> {
  const envelope = await apiClient.requestEnvelope<CustomerSummary[]>('/customers', {
    method: 'GET',
    query: {
      search: query.search,
      cursor: query.cursor,
      limit: query.limit != null ? String(query.limit) : undefined,
      active: query.active === undefined ? undefined : query.active ? 'true' : 'false',
    },
  });
  return {
    items: envelope.data,
    nextCursor: envelope.meta?.nextCursor,
  };
}
