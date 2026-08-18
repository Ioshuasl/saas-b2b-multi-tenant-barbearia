'use client';

import type { TimeBlockTableProps } from '@/packages/admin/types/TimeBlock/TimeBlockFormDialogTypes';
import { GhostButton, SimpleTable } from '@/shared/ui/Ui';

export function TimeBlockTable({ blocks, canWrite, onDelete }: TimeBlockTableProps) {
  if (!blocks.length) {
    return <p className="text-sm opacity-70">Nenhum bloqueio neste período.</p>;
  }

  return (
    <SimpleTable headers={['Início', 'Fim', 'Motivo', '']}>
      {blocks.map((block) => (
        <tr key={block.id} className="border-b border-white/5">
          <td className="py-2 pr-3">{new Date(block.startsAt).toLocaleString('pt-BR')}</td>
          <td className="py-2 pr-3">{new Date(block.endsAt).toLocaleString('pt-BR')}</td>
          <td className="py-2 pr-3">{block.reason}</td>
          <td className="py-2 pr-3">
            {canWrite ? (
              <GhostButton type="button" onClick={() => onDelete(block.id)}>
                Remover
              </GhostButton>
            ) : null}
          </td>
        </tr>
      ))}
    </SimpleTable>
  );
}
