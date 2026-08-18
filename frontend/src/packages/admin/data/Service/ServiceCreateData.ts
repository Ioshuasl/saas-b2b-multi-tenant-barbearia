import { apiClient } from '@/shared/api/api-client';
import { reaisToCents } from '@/shared/helpers/Money';
import type { ServiceFormValues, ServiceSummary } from '@/packages/admin/types/Service/ServiceTypes';

export async function ServiceCreateData(values: ServiceFormValues): Promise<ServiceSummary> {
  return apiClient.request('/services', {
    method: 'POST',
    body: JSON.stringify({
      name: values.name,
      description: values.description || undefined,
      durationMinutes: values.durationMinutes,
      bufferMinutes: values.bufferMinutes,
      priceCents: reaisToCents(values.priceReais),
      visibleOnline: values.visibleOnline,
    }),
  });
}
