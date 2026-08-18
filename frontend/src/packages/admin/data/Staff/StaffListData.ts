import { apiClient } from '@/shared/api/api-client';
import type { StaffSummary } from '@/packages/admin/types/Staff/StaffTypes';

export async function StaffListData(): Promise<StaffSummary[]> {
  return apiClient.request('/staff');
}
