import { z } from 'zod';

export const PublicBookingError = {
  SLOT_TAKEN: 'SLOT_TAKEN',
  TOO_LATE_TO_CANCEL: 'TOO_LATE_TO_CANCEL',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  MAX_FUTURE_BOOKINGS: 'MAX_FUTURE_BOOKINGS',
  CAPTCHA_REQUIRED: 'CAPTCHA_REQUIRED',
  INVALID_CANCEL_TOKEN: 'INVALID_CANCEL_TOKEN',
  LEAD_TIME_VIOLATION: 'LEAD_TIME_VIOLATION',
  HORIZON_EXCEEDED: 'HORIZON_EXCEEDED',
} as const;

export type PublicBookingErrorCode =
  (typeof PublicBookingError)[keyof typeof PublicBookingError];

export type PublicStaffCard = {
  id: string;
  name: string;
};

export type PublicServiceCard = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
};

export type PublicLocation = {
  id: string;
  slug: string;
  name: string;
  address: {
    zip?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
  } | null;
  latitude: number | null;
  longitude: number | null;
  bookingAvailable: boolean;
};

export type PublicLocationDetail = PublicLocation & {
  timezone: string;
  phone: string | null;
  services: PublicServiceCard[];
  staff: PublicStaffCard[];
};

export type PublicTenant = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  locations: PublicLocation[];
};

export type PublicSlugParams = {
  tenantSlug: string;
  locationSlug: string;
};

export type PublicAvailabilityListQuery = PublicSlugParams & {
  serviceIds: string[];
  staffId?: string;
  from: string;
  to: string;
};

export const publicAvailabilityListQuerySchema = z.object({
  tenantSlug: z.string().min(1).max(48),
  locationSlug: z.string().min(1).max(48),
  serviceIds: z.array(z.string().uuid()).min(1),
  staffId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const publicBookSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1),
  staffId: z.string().uuid().nullable().optional(),
  startsAt: z.string().datetime(),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().min(8).max(20),
    email: z.string().trim().email().optional(),
  }),
  consentDataProcessing: z.boolean(),
  consentWhatsappMarketing: z.boolean().optional().default(false),
  website: z.string().max(200).optional(),
  captchaToken: z.string().max(500).optional(),
});

export type PublicBookBody = z.infer<typeof publicBookSchema>;

export const publicRescheduleSchema = z.object({
  startsAt: z.string().datetime(),
  staffId: z.string().uuid().nullable().optional(),
  serviceIds: z.array(z.string().uuid()).min(1).optional(),
  captchaToken: z.string().max(500).optional(),
});

export type PublicRescheduleBody = z.infer<typeof publicRescheduleSchema>;

export const publicCancelSchema = z.object({
  reason: z.string().min(2).max(500).optional(),
});

export type PublicCancelBody = z.infer<typeof publicCancelSchema>;

export const publicTokenQuerySchema = z.object({
  token: z.string().uuid(),
});

export type PublicAppointmentCreated = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  staff: PublicStaffCard;
  services: Array<{ name: string; durationMinutes: number; priceCents: number }>;
  totalPriceCents: number;
  cancelToken: string;
};

export type PublicAppointmentRescheduled = Omit<PublicAppointmentCreated, 'cancelToken'>;

export type PublicAppointmentMasked = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  customer: { name: string; phoneMasked: string };
  staff: PublicStaffCard;
  services: Array<{ name: string; durationMinutes: number; priceCents: number }>;
  totalPriceCents: number;
};

export type PublicAppointmentTokenParams = PublicSlugParams & {
  id: string;
  token: string;
};
