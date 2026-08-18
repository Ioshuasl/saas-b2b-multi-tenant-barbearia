import { apiClient } from '@/shared/api/api-client';
import type { MeResponse } from '@/shared/auth/MeTypes';

export async function SessionMeData(): Promise<MeResponse> {
  return apiClient.request('/auth/me');
}
