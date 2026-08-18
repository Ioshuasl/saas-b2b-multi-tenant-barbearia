'use client';

import { formatInTimeZone } from 'date-fns-tz';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_ICONS,
} from '@/packages/operacional/enum/Appointment/AppointmentStatusStyles';
import { APPOINTMENT_STATUS_LABELS } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import { formatDayLabel, formatTimeInTimezone } from '@/packages/operacional/helpers/appointment_timezone';
import type { AppointmentSummary } from '@repo/contracts';
import type { AppointmentWeekViewProps } from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { Card } from '@/shared/ui/Ui';
import { formatBRL } from '@/shared/helpers/Money';

export function AppointmentWeekView({
  dayKeys,
  timezone,
  appointments,
  onDayClick,
  onAppointmentClick,
}: AppointmentWeekViewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {dayKeys.map((dayKey) => {
        const dayItems = appointments.filter(
          (item) => formatInTimeZone(item.startsAt, timezone, 'yyyy-MM-dd') === dayKey,
        );
        return (
          <Card key={dayKey} className="flex min-h-40 flex-col">
            <button
              type="button"
              className="mb-2 text-left text-sm font-semibold underline-offset-2 hover:underline"
              onClick={() => onDayClick(dayKey)}
            >
              {formatDayLabel(dayKey, timezone)}
            </button>
            {dayItems.length === 0 ? (
              <p className="text-xs opacity-60">Sem agendamentos</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayItems.map((item) => (
                  <li key={item.id}>
                    <WeekAppointmentButton item={item} timezone={timezone} onClick={() => onAppointmentClick(item)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function WeekAppointmentButton({
  item,
  timezone,
  onClick,
}: {
  item: AppointmentSummary;
  timezone: string;
  onClick: () => void;
}) {
  const statusClass = APPOINTMENT_STATUS_COLORS[item.status];
  const icon = APPOINTMENT_STATUS_ICONS[item.status];
  const label = APPOINTMENT_STATUS_LABELS[item.status];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border px-2 py-1.5 text-left text-xs ${statusClass}`}
    >
      <span className="font-semibold">
        {icon} {formatTimeInTimezone(item.startsAt, timezone)} · {item.customerName}
      </span>
      <span className="block opacity-70">
        {item.staffName} · {label} · {formatBRL(item.totalPriceCents)}
      </span>
    </button>
  );
}
