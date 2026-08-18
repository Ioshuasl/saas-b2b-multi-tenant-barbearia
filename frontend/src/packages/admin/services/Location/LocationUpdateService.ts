import { LocationUpdateData } from '@/packages/admin/data/Location/LocationUpdateData';
import type { LocationFormValues } from '@/packages/admin/types/Location/LocationTypes';

export async function LocationUpdateService(id: string, values: LocationFormValues) {
  return LocationUpdateData(id, values);
}
