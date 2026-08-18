import { apiClient } from '@/shared/api/api-client';
import type { UserSummary } from '@/packages/admin/types/User/UserTypes';

export async function UserListData(): Promise<UserSummary[]> {
  return apiClient.request('/users');
}
