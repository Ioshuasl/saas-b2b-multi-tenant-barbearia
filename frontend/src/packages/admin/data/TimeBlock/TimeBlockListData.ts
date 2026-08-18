import { apiClient } from '@/shared/api/api-client';
import type { TimeBlockSummary } from '@/packages/admin/types/TimeBlock/TimeBlockTypes';

export async function TimeBlockListData(locationId: string): Promise<TimeBlockSummary[]> {
  return apiClient.request('/time-blocks', { query: { locationId } });
}
