import { StaffReplaceServicesData } from '@/packages/admin/data/Staff/StaffReplaceServicesData';

export async function StaffReplaceServicesService(id: string, serviceIds: string[]) {
  return StaffReplaceServicesData(id, serviceIds);
}
