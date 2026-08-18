'use client';

import { useQuery } from '@tanstack/react-query';
import { InvitationListService } from '@/packages/admin/services/Invitation/InvitationListService';

export function useInvitationListHook() {
  return useQuery({
    queryKey: ['invitations', 'list'],
    queryFn: InvitationListService,
  });
}
