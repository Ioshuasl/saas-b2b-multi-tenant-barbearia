'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invitationSchema } from '@/packages/admin/schemas/Invitation/InvitationSchema';
import type { InvitationFormValues } from '@/packages/admin/types/Invitation/InvitationTypes';

export function useInvitationFormHook() {
  return useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { email: '', role: 'STAFF', locationIds: [] },
  });
}
