import { apiClient } from '@/shared/api/api-client';
import type { LocationFormValues, LocationSummary } from '@/packages/admin/types/Location/LocationTypes';

export async function LocationUpdateData(
  id: string,
  values: LocationFormValues,
): Promise<LocationSummary> {
  return apiClient.request(`/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: values.name,
      slug: values.slug || undefined,
      timezone: values.timezone,
      phone: values.phone || null,
      email: values.email || null,
      address:
        values.city || values.state || values.street
          ? { city: values.city || undefined, state: values.state || undefined, street: values.street || undefined }
          : null,
      active: values.active,
      isDefault: values.isDefault,
    }),
  });
}
