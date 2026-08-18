import { InvitationCreateData } from '@/packages/admin/data/Invitation/InvitationCreateData';
import type { InvitationFormValues } from '@/packages/admin/types/Invitation/InvitationTypes';

export async function InvitationCreateService(values: InvitationFormValues) {
  return InvitationCreateData(values);
}
