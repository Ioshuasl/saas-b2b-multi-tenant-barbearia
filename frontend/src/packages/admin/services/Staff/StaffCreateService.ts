import { StaffCreateData } from '@/packages/admin/data/Staff/StaffCreateData';
import type { StaffFormValues } from '@/packages/admin/types/Staff/StaffTypes';

export async function StaffCreateService(values: StaffFormValues) {
  return StaffCreateData(values);
}
