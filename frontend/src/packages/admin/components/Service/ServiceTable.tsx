'use client';

import type { ServiceTableProps } from '@/packages/admin/types/Service/ServiceFormDialogTypes';
import { formatBRL } from '@/shared/helpers/Money';
import { GhostButton, SimpleTable } from '@/shared/ui/Ui';

export function ServiceTable({ services, canWrite, onEdit }: ServiceTableProps) {
  if (!services.length) {
    return <p className="text-sm opacity-70">Nenhum serviço cadastrado.</p>;
  }

  return (
    <SimpleTable headers={['Nome', 'Duração', 'Preço', 'Ativo', '']}>
      {services.map((service) => (
        <tr key={service.id} className="border-b border-white/5">
          <td className="py-2 pr-3">{service.name}</td>
          <td className="py-2 pr-3">{service.durationMinutes} min</td>
          <td className="py-2 pr-3">{formatBRL(service.priceCents)}</td>
          <td className="py-2 pr-3">{service.active ? 'Sim' : 'Não'}</td>
          <td className="py-2 pr-3">
            {canWrite ? (
              <GhostButton type="button" onClick={() => onEdit(service)}>
                Editar
              </GhostButton>
            ) : null}
          </td>
        </tr>
      ))}
    </SimpleTable>
  );
}
