'use client';

import { useRef } from 'react';
import { AppointmentCard } from '@/packages/operacional/components/Appointment/AppointmentCard';
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  ROW_HEIGHT_PX,
  SLOT_MINUTES,
  gridHeightPx,
  slotCount,
  timeLabels,
  yToMinutes,
} from '@/packages/operacional/helpers/appointment_grid';
import { slotIsoFromDay } from '@/packages/operacional/helpers/appointment_timezone';
import type { AppointmentDayViewProps } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export function AppointmentDayView({
  dayKey,
  timezone,
  staff,
  appointments,
  onSlotClick,
  onAppointmentClick,
  onReschedule,
}: AppointmentDayViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  function handleDrop(staffId: string, event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const appointmentId = event.dataTransfer.getData('application/appointment-id');
    if (!appointmentId || !gridRef.current) return;
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top + (gridRef.current.scrollTop ?? 0);
    const minutes = yToMinutes(y);
    const startsAt = slotIsoFromDay(dayKey, minutes, timezone);
    onReschedule({ appointment, staffId, startsAt, dayKey });
  }

  return (
    <div ref={gridRef} className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      <div
        className="grid min-w-full"
        style={{
          gridTemplateColumns: `56px repeat(${Math.max(staff.length, 1)}, minmax(140px, 1fr))`,
        }}
      >
        <div className="sticky left-0 z-10 border-r border-white/10 bg-[#0f1115]" />
        {staff.map((member) => (
          <div
            key={member.id}
            className="sticky top-0 z-10 border-b border-white/10 bg-[#0f1115] px-2 py-2 text-center text-sm font-medium"
          >
            {member.name}
          </div>
        ))}
        <div className="relative border-r border-white/10">
          {timeLabels().map((label) => (
            <div
              key={label}
              className="border-b border-white/5 pr-2 text-right text-xs opacity-60"
              style={{ height: (60 / SLOT_MINUTES) * ROW_HEIGHT_PX }}
            >
              {label}
            </div>
          ))}
        </div>
        {staff.map((member) => {
          const columnAppointments = appointments.filter((item) => item.staffId === member.id);
          return (
            <div
              key={member.id}
              className="relative border-r border-white/10 bg-white/[0.02]"
              style={{ height: gridHeightPx() }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(member.id, event)}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const y = event.clientY - rect.top;
                const slotIndex = Math.floor(y / ROW_HEIGHT_PX);
                if (slotIndex < 0 || slotIndex >= slotCount()) return;
                const minutes = GRID_START_HOUR * 60 + slotIndex * SLOT_MINUTES;
                if (minutes >= GRID_END_HOUR * 60) return;
                onSlotClick({
                  staffId: member.id,
                  startsAt: slotIsoFromDay(dayKey, minutes, timezone),
                  dayKey,
                });
              }}
            >
              {Array.from({ length: slotCount() }).map((_, index) => (
                <div
                  key={index}
                  className="border-b border-white/5"
                  style={{ height: ROW_HEIGHT_PX }}
                />
              ))}
              {columnAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  dayKey={dayKey}
                  timezone={timezone}
                  onClick={() => onAppointmentClick(appointment)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
