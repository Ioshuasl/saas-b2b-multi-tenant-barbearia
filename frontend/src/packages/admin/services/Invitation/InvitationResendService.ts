import { InvitationResendData } from '@/packages/admin/data/Invitation/InvitationResendData';

export async function InvitationResendService(id: string) {
  return InvitationResendData(id);
}
