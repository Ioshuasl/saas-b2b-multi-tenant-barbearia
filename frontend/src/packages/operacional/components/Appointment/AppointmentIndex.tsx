'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addDays } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { AppointmentStatusName, AppointmentSummary } from '@repo/contracts';
import { AppointmentDayView } from '@/packages/operacional/components/Appointment/AppointmentDayView';
import { AppointmentWeekView } from '@/packages/operacional/components/Appointment/AppointmentWeekView';
import { AppointmentToolbar } from '@/packages/operacional/components/Appointment/AppointmentToolbar';
import { AppointmentFormDialog } from '@/packages/operacional/components/Appointment/AppointmentFormDialog';
import { AppointmentSidebar } from '@/packages/operacional/components/Appointment/AppointmentSidebar';
import { useAppointmentListHook } from '@/packages/operacional/hooks/Appointment/useAppointmentListHook';
import { useAppointmentRescheduleHook } from '@/packages/operacional/hooks/Appointment/useAppointmentRescheduleHook';
import { useLocationListHook } from '@/packages/operacional/hooks/Location/useLocationListHook';
import { useStaffListHook } from '@/packages/operacional/hooks/Staff/useStaffListHook';
import {
  dayRangeIso,
  formatDayKey,
  todayKey,
  weekRangeIso,
} from '@/packages/operacional/helpers/appointment_timezone';
import type {
  AppointmentIndexProps,
  AppointmentSlotDraft,
  AppointmentViewMode,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { useSessionStore } from '@/shared/auth/session';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { PageHeader } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';

export function AppointmentIndex({ defaultView = 'day' }: AppointmentIndexProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const me = useSessionStore((s) => s.me);
  const locationId = useSessionStore((s) => s.locationId);
  const canWrite = me?.permissions.includes('agenda.write') ?? false;
  const isStaff = me?.role === 'STAFF';

  const locationsQuery = useLocationListHook();
  const staffQuery = useStaffListHook();

  const activeLocation = useMemo(
    () => locationsQuery.data?.find((location) => location.id === locationId),
    [locationsQuery.data, locationId],
  );
  const timezone = activeLocation?.timezone ?? 'America/Sao_Paulo';

  const [view] = useState<AppointmentViewMode>(defaultView);
  const [dayKey, setDayKey] = useState(() => todayKey(timezone));
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<
    { appointment: AppointmentSummary | null; draft: AppointmentSlotDraft | null } | undefined
  >(undefined);

  useEffect(() => {
    const day = searchParams.get('day');
    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
      setDayKey(day);
      return;
    }
    setDayKey(todayKey(timezone));
  }, [searchParams, timezone]);

  const effectiveStaffId = isStaff ? (me?.staffId ?? undefined) : staffFilter || undefined;

  const range = useMemo(() => {
    if (view === 'week') return weekRangeIso(fromZonedTime(`${dayKey}T12:00:00`, timezone), timezone);
    const day = dayRangeIso(dayKey, timezone);
    return { ...day, dayKeys: [dayKey] };
  }, [view, dayKey, timezone]);

  const listQuery = useAppointmentListHook({
    from: range.from,
    to: range.to,
    staffId: effectiveStaffId,
    status: (statusFilter || undefined) as AppointmentStatusName | undefined,
  });

  const reschedule = useAppointmentRescheduleHook({
    onSlotTaken: () => toast.show('Este horário acabou de ser reservado.'),
  });

  const staffColumns = useMemo(() => {
    const all = (staffQuery.data ?? []).filter(
      (item) => item.active && (!locationId || item.locationIds.includes(locationId)),
    );
    if (isStaff && me?.staffId) {
      const own = all.find((item) => item.id === me.staffId);
      return own ? [{ id: own.id, name: own.name }] : [];
    }
    if (effectiveStaffId) {
      const one = all.find((item) => item.id === effectiveStaffId);
      return one ? [{ id: one.id, name: one.name }] : [];
    }
    return all.map((item) => ({ id: item.id, name: item.name }));
  }, [staffQuery.data, locationId, isStaff, me?.staffId, effectiveStaffId]);

  const appointments = listQuery.data ?? [];

  const shiftDay = useCallback(
    (delta: number) => {
      const anchor = fromZonedTime(`${dayKey}T12:00:00`, timezone);
      setDayKey(formatDayKey(addDays(anchor, delta), timezone));
    },
    [dayKey, timezone],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT') {
        return;
      }
      if (event.key === 'Escape') {
        setSelectedId(null);
        setFormState(undefined);
        return;
      }
      if (event.key === 'n' && canWrite) {
        setFormState({ appointment: null, draft: null });
        return;
      }
      if (event.key === 't') {
        setDayKey(todayKey(timezone));
        return;
      }
      if (event.key === 'ArrowLeft') {
        shiftDay(view === 'week' ? -7 : -1);
        return;
      }
      if (event.key === 'ArrowRight') {
        shiftDay(view === 'week' ? 7 : 1);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canWrite, shiftDay, timezone, view]);

  function openCreate(draft: AppointmentSlotDraft | null = null) {
    setFormState({ appointment: null, draft });
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Agenda"
          description={
            isStaff
              ? 'Seus atendimentos do dia.'
              : 'Grade por profissional. Atalhos: n novo, ←/→ dia, t hoje, Esc fecha.'
          }
        />
        <AppointmentToolbar
          dayKey={dayKey}
          timezone={timezone}
          view={view}
          onPrev={() => shiftDay(view === 'week' ? -7 : -1)}
          onNext={() => shiftDay(view === 'week' ? 7 : 1)}
          onToday={() => setDayKey(todayKey(timezone))}
          staffFilter={staffFilter}
          onStaffFilterChange={setStaffFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          staffOptions={staffColumns}
          showStaffFilter={!isStaff}
          canWrite={canWrite}
          onNew={() => openCreate()}
        />
        {listQuery.isLoading ? <p className="text-sm opacity-70">Carregando agenda…</p> : null}
        {listQuery.isError ? (
          <p className="text-sm text-red-300">{apiErrorMessage(listQuery.error)}</p>
        ) : null}
        {!listQuery.isLoading && !listQuery.isError && view === 'day' ? (
          <AppointmentDayView
            dayKey={dayKey}
            timezone={timezone}
            staff={staffColumns}
            appointments={appointments}
            onSlotClick={(draft) => canWrite && openCreate(draft)}
            onAppointmentClick={(appointment) => setSelectedId(appointment.id)}
            onReschedule={({ appointment, staffId, startsAt }) => {
              if (!canWrite) return;
              void reschedule.mutateAsync({
                appointment,
                appointmentSchema: { startsAt, staffId },
              });
            }}
          />
        ) : null}
        {!listQuery.isLoading && !listQuery.isError && view === 'week' ? (
          <AppointmentWeekView
            dayKeys={range.dayKeys}
            timezone={timezone}
            appointments={appointments}
            onDayClick={(key) => router.push(`/?day=${key}`)}
            onAppointmentClick={(appointment) => setSelectedId(appointment.id)}
          />
        ) : null}
      </div>
      {selectedId ? (
        <AppointmentSidebar
          appointmentId={selectedId}
          timezone={timezone}
          onClose={() => setSelectedId(null)}
          onEdit={(appointment) => {
            setSelectedId(null);
            setFormState({ appointment, draft: null });
          }}
        />
      ) : null}
      {formState !== undefined ? (
        <AppointmentFormDialog
          appointment={formState.appointment}
          draft={formState.draft}
          dayKey={dayKey}
          onClose={() => setFormState(undefined)}
        />
      ) : null}
      {toast.message ? <Toast message={toast.message} onClose={toast.clear} /> : null}
    </div>
  );
}
