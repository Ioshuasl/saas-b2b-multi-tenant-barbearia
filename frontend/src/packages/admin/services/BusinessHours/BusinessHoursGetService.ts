import { BusinessHoursGetData } from '@/packages/admin/data/BusinessHours/BusinessHoursGetData';

export async function BusinessHoursGetService(locationId: string) {
  return BusinessHoursGetData(locationId);
}
