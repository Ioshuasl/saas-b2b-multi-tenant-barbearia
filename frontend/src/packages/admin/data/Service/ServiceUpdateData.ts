import { apiClient } from '@/shared/api/api-client';
import { reaisToCents } from '@/shared/helpers/Money';
import type { ServiceFormValues, ServiceSummary } from '@/packages/admin/types/Service/ServiceTypes';

export async function ServiceUpdateData(
  id: string,
  values: ServiceFormValues,
): Promise<ServiceSummary> {
  return apiClient.request(`/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: values.name,
      description: values.description || null,
      durationMinutes: values.durationMinutes,
      bufferMinutes: values.bufferMinutes,
      priceCents: reaisToCents(values.priceReais),
      visibleOnline: values.visibleOnline,
      active: values.active,
    }),
  });
}
