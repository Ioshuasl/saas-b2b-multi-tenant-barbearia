import { InvitationDeleteData } from '@/packages/admin/data/Invitation/InvitationDeleteData';

export async function InvitationDeleteService(id: string) {
  return InvitationDeleteData(id);
}
