'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomerGetHook } from '@/packages/operacional/hooks/Customer/useCustomerGetHook';
import { useCustomerAppointmentsListHook } from '@/packages/operacional/hooks/Customer/useCustomerAppointmentsListHook';
import { CustomerFormDialog } from '@/packages/operacional/components/Customer/CustomerFormDialog';
import { CustomerInactivateDialog } from '@/packages/operacional/components/Customer/CustomerInactivateDialog';
import { CUSTOMER_ORIGIN_LABELS } from '@/packages/operacional/enum/Customer/CustomerOriginEnum';
import { APPOINTMENT_STATUS_LABELS } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import type { AppointmentStatusName } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import type { CustomerDetailsProps } from '@/packages/operacional/types/Customer/CustomerDetailsTypes';
import { useSessionStore } from '@/shared/auth/session';
import { Button, Card, GhostButton, PageHeader, SimpleTable } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { formatBRL } from '@/shared/helpers/Money';

export function CustomerDetails({ customerId }: CustomerDetailsProps) {
  const router = useRouter();
  const canWrite = useSessionStore((s) => s.me?.permissions.includes('customers.write') ?? false);
  const customer = useCustomerGetHook(customerId);
  const history = useCustomerAppointmentsListHook(customerId);
  const [editing, setEditing] = useState(false);
  const [inactivating, setInactivating] = useState(false);

  if (customer.isLoading) {
    return <p className="text-sm opacity-70">Carregando ficha…</p>;
  }

  if (customer.isError || !customer.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-300">{apiErrorMessage(customer.error)}</p>
        <Link href="/clientes" className="text-sm underline">
          Voltar para clientes
        </Link>
      </div>
    );
  }

  const detail = customer.data;
  const items = history.data?.items ?? [];
  const totalSpentCents = history.data?.totalSpentCents ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={detail.name}
        description={`${detail.phone}${detail.email ? ` · ${detail.email}` : ''} · ${CUSTOMER_ORIGIN_LABELS[detail.origin]}`}
        action={
          <div className="flex flex-wrap gap-2">
            <GhostButton type="button" onClick={() => router.push('/clientes')}>
              Clientes
            </GhostButton>
            {canWrite ? (
              <>
                <Button type="button" onClick={() => setEditing(true)}>
                  Editar
                </Button>
                <GhostButton type="button" onClick={() => setInactivating(true)}>
                  Inativar
                </GhostButton>
              </>
            ) : null}
          </div>
        }
      />
      {canWrite && detail.notes ? (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Observações</h2>
          <p className="whitespace-pre-wrap text-sm opacity-80">{detail.notes}</p>
        </Card>
      ) : null}
      <Card>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <p className="text-sm opacity-80">Total gasto {formatBRL(totalSpentCents)}</p>
        </div>
        {history.isLoading ? <p className="text-sm opacity-70">Carregando atendimentos…</p> : null}
        {history.isError ? (
          <p className="text-sm text-red-300">{apiErrorMessage(history.error)}</p>
        ) : null}
        {!history.isLoading && !history.isError && items.length === 0 ? (
          <p className="text-sm opacity-70">Nenhum atendimento ainda.</p>
        ) : null}
        {items.length > 0 ? (
          <SimpleTable headers={['Quando', 'Unidade', 'Profissional', 'Serviços', 'Status', 'Valor']}>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-white/5">
                <td className="py-2 pr-3">{formatWhen(item.startsAt)}</td>
                <td className="py-2 pr-3">{item.locationName}</td>
                <td className="py-2 pr-3">{item.staffName}</td>
                <td className="py-2 pr-3 opacity-80">
                  {item.services.map((service) => service.name).join(', ') || '—'}
                </td>
                <td className="py-2 pr-3">{statusLabel(item.status)}</td>
                <td className="py-2 pr-3">{formatBRL(item.totalPriceCents)}</td>
              </tr>
            ))}
          </SimpleTable>
        ) : null}
      </Card>
      {editing ? (
        <CustomerFormDialog customer={detail} onClose={() => setEditing(false)} />
      ) : null}
      {inactivating ? (
        <CustomerInactivateDialog
          customer={detail}
          onClose={() => setInactivating(false)}
          onInactivated={() => router.replace('/clientes')}
        />
      ) : null}
    </div>
  );
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function statusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status as AppointmentStatusName] ?? status;
}
