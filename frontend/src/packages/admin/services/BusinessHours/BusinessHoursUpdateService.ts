import { BusinessHoursUpdateData } from '@/packages/admin/data/BusinessHours/BusinessHoursUpdateData';
import type { BusinessHoursSlot } from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export async function BusinessHoursUpdateService(locationId: string, slots: BusinessHoursSlot[]) {
  return BusinessHoursUpdateData(locationId, slots);
}
