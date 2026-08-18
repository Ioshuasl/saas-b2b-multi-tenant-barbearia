'use client';

import { useState } from 'react';
import { useUserListHook } from '@/packages/admin/hooks/User/useUserListHook';
import { useInvitationListHook } from '@/packages/admin/hooks/Invitation/useInvitationListHook';
import { useInvitationDeleteHook } from '@/packages/admin/hooks/Invitation/useInvitationDeleteHook';
import { useInvitationResendHook } from '@/packages/admin/hooks/Invitation/useInvitationResendHook';
import { UserTable } from '@/packages/admin/components/User/UserTable';
import { UserFormDialog } from '@/packages/admin/components/User/UserFormDialog';
import { InvitationTable } from '@/packages/admin/components/Invitation/InvitationTable';
import { InvitationFormDialog } from '@/packages/admin/components/Invitation/InvitationFormDialog';
import { Button, PageHeader } from '@/shared/ui/Ui';
import type { UserSummary } from '@/packages/admin/types/User/UserTypes';

export function TeamIndex() {
  const users = useUserListHook();
  const invitations = useInvitationListHook();
  const resend = useInvitationResendHook();
  const revoke = useInvitationDeleteHook();
  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Equipe"
        description="Membros com acesso e convites pendentes."
        action={
          <Button type="button" onClick={() => setInviteOpen(true)}>
            Convidar
          </Button>
        }
      />
      <section>
        <h2 className="mb-3 text-lg font-semibold">Membros</h2>
        {users.data ? <UserTable users={users.data} onEdit={setEditing} /> : null}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Convites</h2>
        {invitations.data ? (
          <InvitationTable
            invitations={invitations.data}
            onResend={(id) => resend.mutate(id)}
            onRevoke={(id) => revoke.mutate(id)}
          />
        ) : null}
      </section>
      {editing ? <UserFormDialog user={editing} onClose={() => setEditing(null)} /> : null}
      {inviteOpen ? <InvitationFormDialog onClose={() => setInviteOpen(false)} /> : null}
    </div>
  );
}
