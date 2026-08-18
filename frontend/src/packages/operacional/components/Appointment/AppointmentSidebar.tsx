'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useAppointmentGetHook } from '@/packages/operacional/hooks/Appointment/useAppointmentGetHook';
import { useAppointmentHistoryListHook } from '@/packages/operacional/hooks/Appointment/useAppointmentHistoryListHook';
import { useAppointmentStatusHook } from '@/packages/operacional/hooks/Appointment/useAppointmentStatusHook';
import { AppointmentCancelDialog } from '@/packages/operacional/components/Appointment/AppointmentCancelDialog';
import { APPOINTMENT_STATUS_LABELS } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_ICONS,
} from '@/packages/operacional/enum/Appointment/AppointmentStatusStyles';
import { APPOINTMENT_SOURCE_LABELS } from '@/packages/operacional/enum/Appointment/AppointmentSourceEnum';
import { nextStatusActions } from '@/packages/operacional/helpers/appointment_transitions';
import { formatTimeInTimezone } from '@/packages/operacional/helpers/appointment_timezone';
import type { AppointmentSidebarProps } from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { useSessionStore } from '@/shared/auth/session';
import { Button, Card, GhostButton } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { formatBRL } from '@/shared/helpers/Money';
import type { AppointmentStatusName } from '@repo/contracts';

export function AppointmentSidebar({ appointmentId, timezone, onClose, onEdit }: AppointmentSidebarProps) {
  const canWrite = useSessionStore((s) => s.me?.permissions.includes('agenda.write') ?? false);
  const detail = useAppointmentGetHook(appointmentId);
  const history = useAppointmentHistoryListHook(appointmentId);
  const statusMutation = useAppointmentStatusHook();
  const [cancelOpen, setCancelOpen] = useState(false);

  if (detail.isLoading) {
    return <SidebarShell onClose={onClose}>Carregando…</SidebarShell>;
  }

  if (detail.isError || !detail.data) {
    return (
      <SidebarShell onClose={onClose}>
        <p className="text-sm text-red-300">{apiErrorMessage(detail.error)}</p>
      </SidebarShell>
    );
  }

  const appointment = detail.data;
  const actions = nextStatusActions(appointment.status);
  const statusClass = APPOINTMENT_STATUS_COLORS[appointment.status];
  const icon = APPOINTMENT_STATUS_ICONS[appointment.status];

  async function transition(status: AppointmentStatusName) {
    if (status === 'CANCELLED') {
      setCancelOpen(true);
      return;
    }
    await statusMutation.mutateAsync({
      id: appointment.id,
      appointmentSchema: { status },
    });
  }

  return (
    <>
      <SidebarShell onClose={onClose}>
        <div className={`rounded-md border px-3 py-2 text-sm ${statusClass}`}>
          <span className="font-semibold">
            {icon} {APPOINTMENT_STATUS_LABELS[appointment.status]}
          </span>
        </div>
        <div className="text-sm">
          <p className="font-semibold">{appointment.customerName}</p>
          <p className="opacity-80">
            {formatTimeInTimezone(appointment.startsAt, timezone)} –{' '}
            {formatTimeInTimezone(appointment.endsAt, timezone)}
          </p>
          <p className="opacity-80">{appointment.staffName}</p>
          <p className="opacity-80">
            {appointment.services.map((service) => service.name).join(', ')}
          </p>
          <p className="opacity-80">{APPOINTMENT_SOURCE_LABELS[appointment.source]}</p>
          <p className="mt-2 font-medium">{formatBRL(appointment.totalPriceCents)}</p>
          <Link href={`/clientes/${appointment.customerId}`} className="mt-2 inline-block text-sm underline">
            Ver ficha do cliente
          </Link>
        </div>
        {appointment.notes ? (
          <div className="text-sm">
            <p className="font-medium">Observações</p>
            <p className="whitespace-pre-wrap opacity-80">{appointment.notes}</p>
          </div>
        ) : null}
        {canWrite ? (
          <div className="flex flex-col gap-2">
            {actions
              .filter((status) => status !== 'CANCELLED')
              .map((status) => (
                <Button
                  key={status}
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => void transition(status)}
                >
                  {APPOINTMENT_STATUS_LABELS[status]}
                </Button>
              ))}
            {actions.includes('CANCELLED') ? (
              <GhostButton type="button" onClick={() => setCancelOpen(true)}>
                Cancelar agendamento
              </GhostButton>
            ) : null}
            <GhostButton type="button" onClick={() => onEdit(appointment)}>
              Editar horário/serviços
            </GhostButton>
          </div>
        ) : null}
        <p className="text-xs opacity-50">Registrar pagamento — disponível em breve</p>
        <div className="text-sm">
          <p className="mb-2 font-medium">Histórico</p>
          {history.isLoading ? <p className="opacity-70">Carregando…</p> : null}
          {history.data?.length ? (
            <ul className="flex flex-col gap-2 opacity-80">
              {history.data.map((item) => (
                <li key={item.id} className="border-b border-white/5 pb-2 text-xs">
                  <span className="font-medium">{item.action}</span>
                  <span className="block">{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs opacity-60">Sem eventos.</p>
          )}
        </div>
        {statusMutation.isError ? (
          <p className="text-sm text-red-300">{apiErrorMessage(statusMutation.error)}</p>
        ) : null}
      </SidebarShell>
      {cancelOpen ? (
        <AppointmentCancelDialog
          appointmentId={appointment.id}
          onClose={() => setCancelOpen(false)}
          onCancelled={onClose}
        />
      ) : null}
    </>
  );
}

function SidebarShell({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-white/10 bg-[#0f1115] p-4 shadow-xl md:static md:max-h-[calc(100vh-120px)] md:shrink-0 md:overflow-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agendamento</h2>
        <GhostButton type="button" onClick={onClose}>
          Fechar
        </GhostButton>
      </div>
      <Card className="flex flex-col gap-4">{children}</Card>
    </aside>
  );
}
