import { TimeBlockCreateData } from '@/packages/admin/data/TimeBlock/TimeBlockCreateData';
import type { TimeBlockFormValues } from '@/packages/admin/types/TimeBlock/TimeBlockTypes';

export async function TimeBlockCreateService(locationId: string, values: TimeBlockFormValues) {
  return TimeBlockCreateData(locationId, values);
}
