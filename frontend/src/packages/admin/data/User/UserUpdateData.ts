import { apiClient } from '@/shared/api/api-client';
import type { UserFormValues } from '@/packages/admin/types/User/UserTypes';

export async function UserUpdateData(id: string, values: UserFormValues): Promise<{ ok: boolean }> {
  return apiClient.request(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      role: values.role,
      active: values.active,
      locationIds: values.locationIds,
    }),
  });
}
