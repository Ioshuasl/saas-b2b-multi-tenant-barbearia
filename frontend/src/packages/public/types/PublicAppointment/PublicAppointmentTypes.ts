import type {
  PublicAppointmentCreated,
  PublicAppointmentMasked,
  PublicAppointmentRescheduled,
  PublicAppointmentTokenParams,
  PublicBookBody,
  PublicCancelBody,
  PublicLocationDetail,
  PublicRescheduleBody,
  PublicSlugParams,
} from '@repo/contracts';

export type {
  PublicAppointmentCreated,
  PublicAppointmentMasked,
  PublicAppointmentRescheduled,
  PublicAppointmentTokenParams,
  PublicBookBody,
  PublicCancelBody,
  PublicRescheduleBody,
  PublicSlugParams,
};

export type PublicAppointmentFormValues = {
  name: string;
  phone: string;
  email: string;
  consentDataProcessing: boolean;
  consentWhatsappMarketing: boolean;
  website: string;
  captchaToken: string;
};

export type PublicBookingCustomerStepProps = {
  captchaRequired: boolean;
  submitting: boolean;
  errorMessage?: string;
  onBack: () => void;
  onSubmit: (values: PublicAppointmentFormValues) => Promise<void>;
};

export type PublicBookingConfirmProps = {
  tenantSlug: string;
  locationSlug: string;
  timezone: string;
  appointment: PublicAppointmentCreated;
};

export type PublicAppointmentManageProps = {
  tenantSlug: string;
  locationSlug: string;
  id: string;
  token: string;
};

export type PublicAppointmentManagePanelProps = {
  tenantSlug: string;
  location: PublicLocationDetail;
  id: string;
  token: string;
};
