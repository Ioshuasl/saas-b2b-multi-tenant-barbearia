'use client';

import Link from 'next/link';
import { CUSTOMER_ORIGIN_LABELS } from '@/packages/operacional/enum/Customer/CustomerOriginEnum';
import type { CustomerSummary } from '@/packages/operacional/types/Customer/CustomerTypes';
import { GhostButton } from '@/shared/ui/Ui';

export const customerColumnHeaders = ['Nome', 'Telefone', 'Origem', ''] as const;

export function CustomerRowActions({
  customer,
  canWrite,
  onEdit,
  onInactivate,
}: {
  customer: CustomerSummary;
  canWrite: boolean;
  onEdit: (customer: CustomerSummary) => void;
  onInactivate: (customer: CustomerSummary) => void;
}) {
  if (!canWrite) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <GhostButton type="button" onClick={() => onEdit(customer)}>
        Editar
      </GhostButton>
      <GhostButton type="button" onClick={() => onInactivate(customer)}>
        Inativar
      </GhostButton>
    </div>
  );
}

export function customerOriginLabel(origin: CustomerSummary['origin']): string {
  return CUSTOMER_ORIGIN_LABELS[origin] ?? origin;
}

export function CustomerNameCell({ customer }: { customer: CustomerSummary }) {
  return (
    <Link href={`/clientes/${customer.id}`} className="font-semibold hover:underline">
      {customer.name}
    </Link>
  );
}
