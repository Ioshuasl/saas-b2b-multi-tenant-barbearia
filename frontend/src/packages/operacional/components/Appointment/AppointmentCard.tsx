'use client';

import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_ICONS,
} from '@/packages/operacional/enum/Appointment/AppointmentStatusStyles';
import { APPOINTMENT_STATUS_LABELS } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import { appointmentLayout } from '@/packages/operacional/helpers/appointment_grid';
import { formatTimeInTimezone } from '@/packages/operacional/helpers/appointment_timezone';
import type { AppointmentCardProps } from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { formatBRL } from '@/shared/helpers/Money';

export function AppointmentCard({
  appointment,
  dayKey,
  timezone,
  draggable = true,
  onClick,
}: AppointmentCardProps) {
  const { top, height } = appointmentLayout(
    appointment.startsAt,
    appointment.endsAt,
    dayKey,
    timezone,
  );
  const statusClass = APPOINTMENT_STATUS_COLORS[appointment.status];
  const icon = APPOINTMENT_STATUS_ICONS[appointment.status];
  const label = APPOINTMENT_STATUS_LABELS[appointment.status];

  return (
    <button
      type="button"
      draggable={draggable && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED'}
      onDragStart={(event) => {
        event.dataTransfer.setData('application/appointment-id', appointment.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`absolute left-1 right-1 overflow-hidden rounded-md border px-2 py-1 text-left text-xs ${statusClass}`}
      style={{ top, height: Math.max(height, 28) }}
      aria-label={`${appointment.customerName}, ${label}, ${formatTimeInTimezone(appointment.startsAt, timezone)}`}
    >
      <span className="flex items-center gap-1 font-semibold">
        <span aria-hidden>{icon}</span>
        <span>{appointment.customerName}</span>
      </span>
      <span className="block opacity-80">
        {formatTimeInTimezone(appointment.startsAt, timezone)} · {label}
      </span>
      <span className="block truncate opacity-70">
        {appointment.services.map((service) => service.name).join(', ')} · {formatBRL(appointment.totalPriceCents)}
      </span>
    </button>
  );
}
