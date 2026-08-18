import { z } from 'zod';

const addressSchema = z
  .object({
    zip: z.string().max(16).optional(),
    street: z.string().max(120).optional(),
    number: z.string().max(20).optional(),
    complement: z.string().max(80).optional(),
    district: z.string().max(80).optional(),
    city: z.string().max(80).optional(),
    state: z.string().max(2).optional(),
  })
  .strict();

export const locationCreateSchema = z.object({
  name: z.string().min(2).max(80).transform((v) => v.trim()),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .transform((v) => v.trim().toLowerCase())
    .optional(),
  timezone: z.string().min(3).max(64).default('America/Sao_Paulo'),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().max(254).optional(),
  address: addressSchema.optional(),
  coverUrl: z.string().url().max(500).optional(),
  bookingLeadTimeMinutes: z.number().int().min(0).max(7 * 24 * 60).optional(),
  bookingHorizonDays: z.number().int().min(1).max(365).optional(),
  cancelDeadlineHours: z.number().int().min(0).max(168).optional(),
  acceptsOnlineBooking: z.boolean().optional(),
});

export type LocationCreateSchema = z.infer<typeof locationCreateSchema>;

export const locationUpdateSchema = z
  .object({
    name: z.string().min(2).max(80).transform((v) => v.trim()).optional(),
    slug: z
      .string()
      .min(2)
      .max(48)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .transform((v) => v.trim().toLowerCase())
      .optional(),
    timezone: z.string().min(3).max(64).optional(),
    phone: z.string().min(8).max(20).nullable().optional(),
    email: z.string().email().max(254).nullable().optional(),
    address: addressSchema.nullable().optional(),
    coverUrl: z.string().url().max(500).nullable().optional(),
    bookingLeadTimeMinutes: z.number().int().min(0).max(7 * 24 * 60).optional(),
    bookingHorizonDays: z.number().int().min(1).max(365).optional(),
    cancelDeadlineHours: z.number().int().min(0).max(168).optional(),
    acceptsOnlineBooking: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Informe ao menos um campo.' });

export type LocationUpdateSchema = z.infer<typeof locationUpdateSchema>;
