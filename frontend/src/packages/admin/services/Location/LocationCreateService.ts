import { LocationCreateData } from '@/packages/admin/data/Location/LocationCreateData';
import type { LocationFormValues } from '@/packages/admin/types/Location/LocationTypes';

export async function LocationCreateService(values: LocationFormValues) {
  return LocationCreateData(values);
}
