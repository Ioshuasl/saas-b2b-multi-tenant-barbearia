import { StaffReplaceLocationsData } from '@/packages/admin/data/Staff/StaffReplaceLocationsData';

export async function StaffReplaceLocationsService(id: string, locationIds: string[]) {
  return StaffReplaceLocationsData(id, locationIds);
}
