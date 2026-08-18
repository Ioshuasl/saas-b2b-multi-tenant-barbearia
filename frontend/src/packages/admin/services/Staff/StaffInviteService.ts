import { StaffInviteData } from '@/packages/admin/data/Staff/StaffInviteData';

export async function StaffInviteService(id: string, email: string) {
  return StaffInviteData(id, email);
}
