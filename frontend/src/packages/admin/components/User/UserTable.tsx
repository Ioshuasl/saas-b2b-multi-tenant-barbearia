'use client';

import type { UserTableProps } from '@/packages/admin/types/User/UserFormDialogTypes';
import { USER_ROLE_LABEL } from '@/packages/admin/enum/User/UserRoleEnum';
import { GhostButton, SimpleTable } from '@/shared/ui/Ui';

export function UserTable({ users, onEdit }: UserTableProps) {
  return (
    <SimpleTable headers={['Nome', 'E-mail', 'Papel', 'Status', '']}>
      {users.map((user) => (
        <tr key={user.id} className="border-b border-white/5">
          <td className="py-2 pr-3">{user.name}</td>
          <td className="py-2 pr-3">{user.email}</td>
          <td className="py-2 pr-3">
            {USER_ROLE_LABEL[user.role as keyof typeof USER_ROLE_LABEL] ?? user.role}
          </td>
          <td className="py-2 pr-3">{user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</td>
          <td className="py-2 pr-3">
            <GhostButton type="button" onClick={() => onEdit(user)}>
              Editar
            </GhostButton>
          </td>
        </tr>
      ))}
    </SimpleTable>
  );
}
