import { apiClient } from '@/shared/api/api-client';
import type { LocationFormValues, LocationSummary } from '@/packages/admin/types/Location/LocationTypes';

export async function LocationCreateData(values: LocationFormValues): Promise<LocationSummary> {
  return apiClient.request('/locations', {
    method: 'POST',
    body: JSON.stringify({
      name: values.name,
      slug: values.slug || undefined,
      timezone: values.timezone || 'America/Sao_Paulo',
      phone: values.phone || undefined,
      email: values.email || undefined,
      address:
        values.city || values.state || values.street
          ? { city: values.city || undefined, state: values.state || undefined, street: values.street || undefined }
          : undefined,
    }),
  });
}
