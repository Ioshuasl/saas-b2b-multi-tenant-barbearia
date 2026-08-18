import { apiClient } from '@/shared/api/api-client';
import type { TimeBlockFormValues, TimeBlockSummary } from '@/packages/admin/types/TimeBlock/TimeBlockTypes';

export async function TimeBlockCreateData(
  locationId: string,
  values: TimeBlockFormValues,
): Promise<TimeBlockSummary> {
  return apiClient.request('/time-blocks', {
    method: 'POST',
    body: JSON.stringify({
      locationId,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      reason: values.reason,
      rrule: values.rrule || undefined,
    }),
  });
}
