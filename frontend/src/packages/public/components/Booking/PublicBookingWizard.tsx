'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PublicBookingServiceStep } from '@/packages/public/components/Booking/PublicBookingServiceStep';
import { PublicBookingStaffStep } from '@/packages/public/components/Booking/PublicBookingStaffStep';
import { PublicBookingSlotStep } from '@/packages/public/components/Booking/PublicBookingSlotStep';
import { PublicBookingCustomerStep } from '@/packages/public/components/Booking/PublicBookingCustomerStep';
import { PublicBookingConfirm } from '@/packages/public/components/Booking/PublicBookingConfirm';
import { PublicBookingStep, type PublicBookingStepName } from '@/packages/public/enum/PublicLocation/PublicBookingStepEnum';
import { usePublicAvailabilityListHook } from '@/packages/public/hooks/PublicAvailability/usePublicAvailabilityListHook';
import { usePublicAppointmentCreateHook } from '@/packages/public/hooks/PublicAppointment/usePublicAppointmentCreateHook';
import { suggestedSlotsFromError } from '@/packages/public/helpers/PublicBookingError';
import { toPublicPhoneE164 } from '@/packages/public/helpers/PublicBookingPhone';
import { savePublicBookingSession } from '@/packages/public/helpers/PublicBookingSession';
import {
  addDaysKey,
  slotDayKey,
  todayKey,
  uniqueSlotsByStart,
  upcomingDayKeys,
} from '@/packages/public/helpers/PublicBookingTime';
import { ApiClientError } from '@/shared/api/api-client';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import type { PublicAppointmentCreated, PublicAppointmentFormValues } from '@/packages/public/types/PublicAppointment/PublicAppointmentTypes';
import type { PublicBookingWizardProps } from '@/packages/public/types/PublicLocation/PublicLocationTypes';
import type { AvailabilitySlot } from '@repo/contracts';

const WINDOW_DAYS = 7;

export function PublicBookingWizard({ tenantSlug, location }: PublicBookingWizardProps) {
  const timezone = location.timezone;
  const toast = useToast();
  const qc = useQueryClient();
  const create = usePublicAppointmentCreateHook();
  const [step, setStep] = useState<PublicBookingStepName>(PublicBookingStep.SERVICE);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string | null | undefined>(undefined);
  const [windowStart, setWindowStart] = useState(() => todayKey(timezone));
  const [dayKey, setDayKey] = useState(() => todayKey(timezone));
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [created, setCreated] = useState<PublicAppointmentCreated | null>(null);

  const dayKeys = useMemo(
    () => upcomingDayKeys(timezone, WINDOW_DAYS, windowStart),
    [timezone, windowStart],
  );

  const availabilityQuery =
    step === PublicBookingStep.SLOT && serviceIds.length > 0
      ? {
          tenantSlug,
          locationSlug: location.slug,
          serviceIds,
          staffId: staffId ?? undefined,
          from: dayKeys[0] ?? windowStart,
          to: dayKeys[dayKeys.length - 1] ?? windowStart,
        }
      : null;

  const availability = usePublicAvailabilityListHook(availabilityQuery);
  const daySlots = useMemo(() => {
    const slots = (availability.data?.slots ?? []).filter(
      (slot) => slotDayKey(slot.startsAt, timezone) === dayKey,
    );
    return staffId === null ? uniqueSlotsByStart(slots) : slots;
  }, [availability.data?.slots, dayKey, staffId, timezone]);

  function toggleService(serviceId: string) {
    setServiceIds((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
    setStaffId(undefined);
    setSelected(null);
  }

  function goSlot() {
    setSelected(null);
    if (!dayKeys.includes(dayKey)) setDayKey(dayKeys[0] ?? todayKey(timezone));
    setStep(PublicBookingStep.SLOT);
  }

  const today = todayKey(timezone);

  function shiftWindow(deltaDays: number) {
    const next = addDaysKey(windowStart, deltaDays, timezone);
    const start = next < today ? today : next;
    setWindowStart(start);
    const keys = upcomingDayKeys(timezone, WINDOW_DAYS, start);
    if (!keys.includes(dayKey)) setDayKey(keys[0] ?? start);
    setSelected(null);
  }

  async function onBook(values: PublicAppointmentFormValues) {
    if (!selected) return;
    const phone = toPublicPhoneE164(values.phone);
    if (!phone) return;

    try {
      const appointment = await create.mutateAsync({
        publicSlugParams: { tenantSlug, locationSlug: location.slug },
        publicBookSchema: {
          serviceIds,
          staffId: staffId ?? null,
          startsAt: selected.startsAt,
          customer: {
            name: values.name.trim(),
            phone,
            ...(values.email.trim() ? { email: values.email.trim() } : {}),
          },
          consentDataProcessing: true,
          consentWhatsappMarketing: values.consentWhatsappMarketing,
          website: values.website.trim() ? values.website : undefined,
          ...(values.captchaToken.trim() ? { captchaToken: values.captchaToken.trim() } : {}),
        },
      });
      savePublicBookingSession(appointment.id, {
        token: appointment.cancelToken,
        serviceIds,
      });
      setCreated(appointment);
      setStep(PublicBookingStep.CONFIRM);
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
        create.reset();
        setStep(PublicBookingStep.SLOT);
        return;
      }
      if (err instanceof ApiClientError && err.code === 'CAPTCHA_REQUIRED') {
        setCaptchaRequired(true);
      }
      if (err instanceof ApiClientError && err.code === 'MAX_FUTURE_BOOKINGS') {
        toast.show(apiErrorMessage(err));
      }
    }
  }

  return (
    <>
      {step === PublicBookingStep.SERVICE ? (
        <PublicBookingServiceStep
          location={location}
          serviceIds={serviceIds}
          onToggle={toggleService}
          onNext={() => setStep(PublicBookingStep.STAFF)}
        />
      ) : null}
      {step === PublicBookingStep.STAFF ? (
        <PublicBookingStaffStep
          staff={location.staff}
          staffId={staffId}
          onSelect={(next) => {
            setStaffId(next);
            setSelected(null);
          }}
          onBack={() => setStep(PublicBookingStep.SERVICE)}
          onNext={goSlot}
        />
      ) : null}
      {step === PublicBookingStep.SLOT ? (
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
          onBack={() => setStep(PublicBookingStep.STAFF)}
          onNext={() => setStep(PublicBookingStep.CUSTOMER)}
        />
      ) : null}
      {step === PublicBookingStep.CUSTOMER ? (
        <PublicBookingCustomerStep
          captchaRequired={captchaRequired}
          submitting={create.isPending}
          errorMessage={create.isError ? apiErrorMessage(create.error) : undefined}
          onBack={() => {
            create.reset();
            setStep(PublicBookingStep.SLOT);
          }}
          onSubmit={onBook}
        />
      ) : null}
      {step === PublicBookingStep.CONFIRM && created ? (
        <PublicBookingConfirm
          tenantSlug={tenantSlug}
          locationSlug={location.slug}
          timezone={timezone}
          appointment={created}
        />
      ) : null}
      {toast.message ? <Toast message={toast.message} onClose={toast.clear} /> : null}
    </>
  );
}
