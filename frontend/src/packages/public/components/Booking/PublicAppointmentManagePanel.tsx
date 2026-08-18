'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PublicBookingSlotStep } from '@/packages/public/components/Booking/PublicBookingSlotStep';
import {
  PublicAppointmentStatusLabel,
  type PublicAppointmentStatusName,
} from '@/packages/public/enum/PublicAppointment/PublicAppointmentStatusEnum';
import { usePublicAppointmentDeleteHook } from '@/packages/public/hooks/PublicAppointment/usePublicAppointmentDeleteHook';
import { usePublicAppointmentGetHook } from '@/packages/public/hooks/PublicAppointment/usePublicAppointmentGetHook';
import { usePublicAppointmentUpdateHook } from '@/packages/public/hooks/PublicAppointment/usePublicAppointmentUpdateHook';
import { usePublicAvailabilityListHook } from '@/packages/public/hooks/PublicAvailability/usePublicAvailabilityListHook';
import { suggestedSlotsFromError } from '@/packages/public/helpers/PublicBookingError';
import { isPublicNotFoundError } from '@/packages/public/helpers/PublicBookingNotFound';
import { loadPublicBookingSession } from '@/packages/public/helpers/PublicBookingSession';
import {
  addDaysKey,
  formatDateTimeInTimezone,
  slotDayKey,
  todayKey,
  uniqueSlotsByStart,
  upcomingDayKeys,
} from '@/packages/public/helpers/PublicBookingTime';
import { ApiClientError } from '@/shared/api/api-client';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { formatBRL } from '@/shared/helpers/Money';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { Button, Card, GhostButton } from '@/shared/ui/Ui';
import type { PublicAppointmentManagePanelProps } from '@/packages/public/types/PublicAppointment/PublicAppointmentTypes';
import type { AvailabilitySlot, PublicAppointmentMasked } from '@repo/contracts';

const WINDOW_DAYS = 7;
const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);

function statusLabel(status: string): string {
  return PublicAppointmentStatusLabel[status as PublicAppointmentStatusName] ?? status;
}

function resolveServiceIds(
  catalog: PublicAppointmentManagePanelProps['location']['services'],
  appointment: PublicAppointmentMasked,
  stored: string[],
): string[] {
  if (stored.length > 0) return stored;
  const used = new Set<string>();
  const ids: string[] = [];
  for (const line of appointment.services) {
    const match = catalog.find(
      (service) =>
        !used.has(service.id) &&
        service.name === line.name &&
        service.durationMinutes === line.durationMinutes,
    );
    if (!match) return [];
    used.add(match.id);
    ids.push(match.id);
  }
  return ids;
}

export function PublicAppointmentManagePanel({
  tenantSlug,
  location,
  id,
  token,
}: PublicAppointmentManagePanelProps) {
  const timezone = location.timezone;
  const toast = useToast();
  const qc = useQueryClient();
  const params = { tenantSlug, locationSlug: location.slug, id, token };
  const appointmentQuery = usePublicAppointmentGetHook(params);
  const cancel = usePublicAppointmentDeleteHook();
  const reschedule = usePublicAppointmentUpdateHook();

  const [storedServiceIds, setStoredServiceIds] = useState<string[]>([]);
  const [rescheduling, setRescheduling] = useState(false);
  const [windowStart, setWindowStart] = useState(() => todayKey(timezone));
  const [dayKey, setDayKey] = useState(() => todayKey(timezone));
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);

  useEffect(() => {
    const session = loadPublicBookingSession(id);
    if (session?.serviceIds.length) setStoredServiceIds(session.serviceIds);
  }, [id]);

  const appointment = appointmentQuery.data;
  const serviceIds = appointment ? resolveServiceIds(location.services, appointment, storedServiceIds) : [];
  const dayKeys = useMemo(
    () => upcomingDayKeys(timezone, WINDOW_DAYS, windowStart),
    [timezone, windowStart],
  );
  const today = todayKey(timezone);

  const availabilityQuery =
    rescheduling && serviceIds.length > 0
      ? {
          tenantSlug,
          locationSlug: location.slug,
          serviceIds,
          from: dayKeys[0] ?? windowStart,
          to: dayKeys[dayKeys.length - 1] ?? windowStart,
        }
      : null;
  const availability = usePublicAvailabilityListHook(availabilityQuery);
  const daySlots = useMemo(() => {
    const slots = (availability.data?.slots ?? []).filter(
      (slot) => slotDayKey(slot.startsAt, timezone) === dayKey,
    );
    return uniqueSlotsByStart(slots);
  }, [availability.data?.slots, dayKey, timezone]);

  if (appointmentQuery.isError && isPublicNotFoundError(appointmentQuery.error)) {
    notFound();
  }

  function shiftWindow(deltaDays: number) {
    const next = addDaysKey(windowStart, deltaDays, timezone);
    const start = next < today ? today : next;
    setWindowStart(start);
    const keys = upcomingDayKeys(timezone, WINDOW_DAYS, start);
    if (!keys.includes(dayKey)) setDayKey(keys[0] ?? start);
    setSelected(null);
  }

  async function onCancel() {
    try {
      await cancel.mutateAsync({ publicAppointmentTokenParams: params });
    } catch {
      /* erro no mutation */
    }
  }

  async function onConfirmReschedule() {
    if (!selected) return;
    try {
      await reschedule.mutateAsync({
        publicAppointmentTokenParams: params,
        publicRescheduleSchema: {
          startsAt: selected.startsAt,
          staffId: selected.staffId,
        },
      });
      setRescheduling(false);
      setSelected(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'SLOT_TAKEN') {
        toast.show(apiErrorMessage(err));
        await qc.invalidateQueries({ queryKey: ['public-availability'] });
        const suggested = suggestedSlotsFromError(err);
        if (suggested[0]) {
          const key = slotDayKey(suggested[0], timezone);
          setDayKey(key);
          setWindowStart(key < today ? today : key);
        }
        setSelected(null);
        return;
      }
      if (err instanceof ApiClientError && err.code === 'TOO_LATE_TO_CANCEL') {
        toast.show(apiErrorMessage(err));
      }
    }
  }

  if (appointmentQuery.isPending) {
    return <p className="mt-6 text-sm opacity-80">Carregando agendamento…</p>;
  }

  if (appointmentQuery.isError) {
    return <p className="mt-6 text-sm text-red-300">{apiErrorMessage(appointmentQuery.error)}</p>;
  }

  if (!appointment) return null;

  const canChange = !TERMINAL.has(appointment.status);

  return (
    <section className="mt-6 flex flex-col gap-3">
      <Card>
        <p className="text-sm opacity-80">{statusLabel(appointment.status)}</p>
        <p className="mt-1 font-medium">{formatDateTimeInTimezone(appointment.startsAt, timezone)}</p>
        <p className="mt-2 text-sm opacity-80">
          {appointment.services.map((service) => service.name).join(', ')}
        </p>
        <p className="mt-1 text-sm opacity-80">{appointment.staff.name}</p>
        <p className="mt-1 text-sm opacity-80">
          {appointment.customer.name} · {appointment.customer.phoneMasked}
        </p>
        <p className="mt-2 font-medium">{formatBRL(appointment.totalPriceCents)}</p>
      </Card>

      {cancel.isError ? <p className="text-sm text-red-300">{apiErrorMessage(cancel.error)}</p> : null}
      {reschedule.isError ? (
        <p className="text-sm text-red-300">{apiErrorMessage(reschedule.error)}</p>
      ) : null}

      {canChange && !rescheduling ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => {
              setRescheduling(true);
              setSelected(null);
            }}
            disabled={serviceIds.length === 0}
            className="min-h-11"
          >
            Remarcar
          </Button>
          {serviceIds.length === 0 ? (
            <p className="text-sm opacity-80">Não foi possível montar a grade para remarcar neste link.</p>
          ) : null}
          <GhostButton type="button" onClick={() => void onCancel()} disabled={cancel.isPending} className="min-h-11">
            {cancel.isPending ? 'Cancelando…' : 'Cancelar horário'}
          </GhostButton>
        </div>
      ) : null}

      {rescheduling ? (
        <PublicBookingSlotStep
          timezone={timezone}
          dayKeys={dayKeys}
          dayKey={dayKey}
          slots={daySlots}
          selectedStartsAt={selected?.startsAt ?? null}
          loading={availability.isPending}
          errorMessage={availability.isError ? apiErrorMessage(availability.error) : undefined}
          onDayKey={(next) => {
            setDayKey(next);
            setSelected(null);
          }}
          onPrevWindow={() => shiftWindow(-WINDOW_DAYS)}
          onNextWindow={() => shiftWindow(WINDOW_DAYS)}
          canGoPrev={windowStart > today}
          onSelect={setSelected}
          onBack={() => {
            setRescheduling(false);
            setSelected(null);
          }}
          onNext={() => void onConfirmReschedule()}
          nextLabel={reschedule.isPending ? 'Remarcando…' : 'Confirmar novo horário'}
          nextDisabled={!selected || reschedule.isPending}
        />
      ) : null}

      {toast.message ? <Toast message={toast.message} onClose={toast.clear} /> : null}
    </section>
  );
}
