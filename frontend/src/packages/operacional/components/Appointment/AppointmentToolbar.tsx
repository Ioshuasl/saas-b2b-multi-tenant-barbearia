'use client';

import Link from 'next/link';
import { APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABELS } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import type { AppointmentViewMode } from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { Button, GhostButton, Select } from '@/shared/ui/Ui';
import { formatDayLabel } from '@/packages/operacional/helpers/appointment_timezone';

export function AppointmentToolbar({
  dayKey,
  timezone,
  view,
  onPrev,
  onNext,
  onToday,
  staffFilter,
  onStaffFilterChange,
  statusFilter,
  onStatusFilterChange,
  staffOptions,
  showStaffFilter,
  canWrite,
  onNew,
}: {
  dayKey: string;
  timezone: string;
  view: AppointmentViewMode;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  staffFilter: string;
  onStaffFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  staffOptions: Array<{ id: string; name: string }>;
  showStaffFilter: boolean;
  canWrite: boolean;
  onNew: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <GhostButton type="button" onClick={onPrev} aria-label="Dia anterior">
          ←
        </GhostButton>
        <GhostButton type="button" onClick={onToday}>
          Hoje
        </GhostButton>
        <GhostButton type="button" onClick={onNext} aria-label="Próximo dia">
          →
        </GhostButton>
        <span className="text-sm font-medium">{formatDayLabel(dayKey, timezone)}</span>
      </div>
      <div className="flex gap-1">
        <Link href="/">
          <GhostButton type="button" className={view === 'day' ? 'bg-white/10' : ''}>
            Dia
          </GhostButton>
        </Link>
        <Link href="/agenda">
          <GhostButton type="button" className={view === 'week' ? 'bg-white/10' : ''}>
            Semana
          </GhostButton>
        </Link>
      </div>
      {showStaffFilter ? (
        <label className="flex flex-col gap-1 text-xs">
          Profissional
          <Select value={staffFilter} onChange={(event) => onStaffFilterChange(event.target.value)}>
            <option value="">Todos</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-xs">
        Status
        <Select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
          <option value="">Todos</option>
          {APPOINTMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {APPOINTMENT_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </label>
      {canWrite ? (
        <Button type="button" onClick={onNew} className="ml-auto">
          Novo agendamento
        </Button>
      ) : null}
    </div>
  );
}
