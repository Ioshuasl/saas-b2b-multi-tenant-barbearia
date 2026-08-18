import { StaffUpdateData } from '@/packages/admin/data/Staff/StaffUpdateData';
import type { StaffFormValues } from '@/packages/admin/types/Staff/StaffTypes';

export async function StaffUpdateService(id: string, values: StaffFormValues) {
  return StaffUpdateData(id, values);
}
