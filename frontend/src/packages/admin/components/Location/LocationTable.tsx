'use client';

import type { LocationTableProps } from '@/packages/admin/types/Location/LocationFormDialogTypes';
import { GhostButton, SimpleTable } from '@/shared/ui/Ui';

export function LocationTable({ locations, canWrite, onEdit }: LocationTableProps) {
  if (!locations.length) {
    return <p className="text-sm opacity-70">Nenhuma unidade cadastrada.</p>;
  }

  return (
    <SimpleTable headers={['Nome', 'Slug', 'Padrão', 'Ativa', '']}>
      {locations.map((location) => (
        <tr key={location.id} className="border-b border-white/5">
          <td className="py-2 pr-3">{location.name}</td>
          <td className="py-2 pr-3 opacity-70">{location.slug}</td>
          <td className="py-2 pr-3">{location.isDefault ? 'Sim' : 'Não'}</td>
          <td className="py-2 pr-3">{location.active ? 'Sim' : 'Não'}</td>
          <td className="py-2 pr-3">
            {canWrite ? (
              <GhostButton type="button" onClick={() => onEdit(location)}>
                Editar
              </GhostButton>
            ) : null}
          </td>
        </tr>
      ))}
    </SimpleTable>
  );
}
