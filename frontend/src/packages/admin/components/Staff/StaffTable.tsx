'use client';

import type { StaffTableProps } from '@/packages/admin/types/Staff/StaffFormDialogTypes';
import { GhostButton, SimpleTable } from '@/shared/ui/Ui';

export function StaffTable({ staff, locationNames, canWrite, onEdit, onInvite }: StaffTableProps) {
  if (!staff.length) {
    return <p className="text-sm opacity-70">Nenhum profissional cadastrado.</p>;
  }

  return (
    <SimpleTable headers={['Nome', 'Unidade', 'Ativo', '']}>
      {staff.map((item) => (
        <tr key={item.id} className="border-b border-white/5">
          <td className="py-2 pr-3">{item.name}</td>
          <td className="py-2 pr-3 opacity-70">{locationNames[item.homeLocationId] ?? '—'}</td>
          <td className="py-2 pr-3">{item.active ? 'Sim' : 'Não'}</td>
          <td className="flex gap-2 py-2 pr-3">
            {canWrite ? (
              <GhostButton type="button" onClick={() => onEdit(item)}>
                Editar
              </GhostButton>
            ) : null}
            {canWrite && !item.userId && onInvite ? (
              <GhostButton type="button" onClick={() => onInvite(item.id)}>
                Convidar
              </GhostButton>
            ) : null}
          </td>
        </tr>
      ))}
    </SimpleTable>
  );
}
