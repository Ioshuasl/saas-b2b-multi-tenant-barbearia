import type { AvailabilitySlot, PublicLocation, PublicLocationDetail, PublicSlugParams, PublicStaffCard } from '@repo/contracts';

export type { PublicLocation, PublicLocationDetail, PublicSlugParams, PublicStaffCard };

export type PublicLocationIndexProps = {
  tenantSlug: string;
  locationSlug: string;
};

export type PublicBookingHeaderProps = {
  title: string;
  description?: string;
  logoUrl?: string | null;
};

export type PublicBookingWizardProps = {
  tenantSlug: string;
  location: PublicLocationDetail;
};

export type PublicBookingServiceStepProps = {
  location: PublicLocationDetail;
  serviceIds: string[];
  onToggle: (serviceId: string) => void;
  onNext: () => void;
};

export type PublicBookingStaffStepProps = {
  staff: PublicStaffCard[];
  staffId: string | null | undefined;
  onSelect: (staffId: string | null) => void;
  onBack: () => void;
  onNext: () => void;
};

export type PublicBookingSlotStepProps = {
  timezone: string;
  dayKeys: string[];
  dayKey: string;
  slots: AvailabilitySlot[];
  selectedStartsAt: string | null;
  loading: boolean;
  errorMessage?: string;
  onDayKey: (dayKey: string) => void;
  onPrevWindow: () => void;
  onNextWindow: () => void;
  canGoPrev: boolean;
  onSelect: (slot: AvailabilitySlot) => void;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
};
