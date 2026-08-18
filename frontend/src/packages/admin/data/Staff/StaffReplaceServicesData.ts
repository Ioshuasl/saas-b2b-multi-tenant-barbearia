import { apiClient } from '@/shared/api/api-client';

export async function StaffReplaceServicesData(
  id: string,
  serviceIds: string[],
): Promise<{ ok: boolean }> {
  return apiClient.request(`/staff/${id}/services`, {
    method: 'PUT',
    body: JSON.stringify({ serviceIds }),
  });
}
