'use client';

import {
  CustomerNameCell,
  CustomerRowActions,
  customerColumnHeaders,
  customerOriginLabel,
} from '@/packages/operacional/components/Customer/CustomerColumns';
import type { CustomerTableProps } from '@/packages/operacional/types/Customer/CustomerTableTypes';
import { SimpleTable } from '@/shared/ui/Ui';

export function CustomerTable({ customers, canWrite, onEdit, onInactivate }: CustomerTableProps) {
  if (!customers.length) {
    return <p className="text-sm opacity-70">Nenhum cliente encontrado.</p>;
  }

  return (
    <SimpleTable headers={[...customerColumnHeaders]}>
      {customers.map((customer) => (
        <tr key={customer.id} className="border-b border-white/5">
          <td className="py-2 pr-3">
            <CustomerNameCell customer={customer} />
          </td>
          <td className="py-2 pr-3 opacity-80">{customer.phone}</td>
          <td className="py-2 pr-3 opacity-70">{customerOriginLabel(customer.origin)}</td>
          <td className="py-2 pr-3">
            <CustomerRowActions
              customer={customer}
              canWrite={canWrite}
              onEdit={onEdit}
              onInactivate={onInactivate}
            />
          </td>
        </tr>
      ))}
    </SimpleTable>
  );
}
