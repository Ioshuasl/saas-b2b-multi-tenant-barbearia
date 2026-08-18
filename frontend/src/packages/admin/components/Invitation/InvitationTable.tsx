'use client';

import type { InvitationTableProps } from '@/packages/admin/types/Invitation/InvitationFormDialogTypes';
import { USER_ROLE_LABEL } from '@/packages/admin/enum/User/UserRoleEnum';
import { GhostButton, SimpleTable } from '@/shared/ui/Ui';

export function InvitationTable({ invitations, onResend, onRevoke }: InvitationTableProps) {
  const pending = invitations.filter((item) => !item.acceptedAt);
  if (!pending.length) {
    return <p className="text-sm opacity-70">Nenhum convite pendente.</p>;
  }

  return (
    <SimpleTable headers={['E-mail', 'Papel', 'Expira', '']}>
      {pending.map((invitation) => (
        <tr key={invitation.id} className="border-b border-white/5">
          <td className="py-2 pr-3">{invitation.email}</td>
          <td className="py-2 pr-3">
            {USER_ROLE_LABEL[invitation.role as keyof typeof USER_ROLE_LABEL] ?? invitation.role}
          </td>
          <td className="py-2 pr-3">{new Date(invitation.expiresAt).toLocaleDateString('pt-BR')}</td>
          <td className="flex gap-2 py-2 pr-3">
            <GhostButton type="button" onClick={() => onResend(invitation.id)}>
              Reenviar
            </GhostButton>
            <GhostButton type="button" onClick={() => onRevoke(invitation.id)}>
              Revogar
            </GhostButton>
          </td>
        </tr>
      ))}
    </SimpleTable>
  );
}
