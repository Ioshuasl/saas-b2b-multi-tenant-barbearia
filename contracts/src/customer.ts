import { z } from 'zod';

export const CustomerOrigin = {
  PUBLIC_PAGE: 'PUBLIC_PAGE',
  PANEL: 'PANEL',
  PHONE: 'PHONE',
  WALKIN: 'WALKIN',
} as const;

export type CustomerOriginName = (typeof CustomerOrigin)[keyof typeof CustomerOrigin];

export const CUSTOMER_ORIGINS = [
  CustomerOrigin.PUBLIC_PAGE,
  CustomerOrigin.PANEL,
  CustomerOrigin.PHONE,
  CustomerOrigin.WALKIN,
] as const;

export const customerOriginSchema = z.enum(CUSTOMER_ORIGINS);

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  firstLocationId: string;
  marketingOptIn: boolean;
  origin: CustomerOriginName;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetail = CustomerSummary & {
  notes: string | null;
  birthdate: string | null;
};

export type CustomerListQuery = {
  search?: string;
  cursor?: string;
  limit?: number;
  active?: boolean;
};

export type CustomerListResult = {
  items: CustomerSummary[];
  nextCursor?: string | null;
};

export type CustomerDuplicateCheck = {
  exists: boolean;
  customerId?: string;
};

export type CustomerAppointmentHistoryItem = {
  id: string;
  locationId: string;
  locationName: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  endsAt: string;
  status: string;
  totalPriceCents: number;
  services: Array<{ name: string; priceCents: number; durationMinutes: number }>;
};

export type CustomerAppointmentsResult = {
  items: CustomerAppointmentHistoryItem[];
  totalSpentCents: number;
};

export const customerCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().min(8).max(20),
  email: z.string().trim().email().optional(),
  notes: z.string().max(2000).optional(),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  marketingOptIn: z.boolean().optional(),
  firstLocationId: z.string().uuid().optional(),
  origin: customerOriginSchema.optional(),
});

export type CustomerCreateBody = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    marketingOptIn: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo.',
  });

export type CustomerUpdateBody = z.infer<typeof customerUpdateSchema>;

export const customerListQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  active: z.boolean().optional(),
});

export const customerDuplicateQuerySchema = z.object({
  phone: z.string().min(8).max(20),
});
