import { z } from 'zod';
import { CUSTOMER_ORIGINS } from '../enum/customer/customer_origin.enum.js';
import { normalizePhoneE164 } from '../helpers/phone_e164.js';

const phoneSchema = z
  .string()
  .min(8)
  .max(20)
  .transform((value) => normalizePhoneE164(value));

export const customerCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: z.string().trim().email().optional(),
  notes: z.string().max(2000).optional(),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  marketingOptIn: z.boolean().optional(),
  firstLocationId: z.string().uuid().optional(),
  origin: z.enum(CUSTOMER_ORIGINS as [string, ...string[]]).optional(),
});

export type CustomerCreateSchema = z.infer<typeof customerCreateSchema>;

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

export type CustomerUpdateSchema = z.infer<typeof customerUpdateSchema>;

export const customerListQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export type CustomerListQuerySchema = z.infer<typeof customerListQuerySchema>;

export const customerDuplicateQuerySchema = z.object({
  phone: phoneSchema,
});

export type CustomerDuplicateQuerySchema = z.infer<typeof customerDuplicateQuerySchema>;

export const customerUpsertByPhoneSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional(),
  locationId: z.string().uuid(),
  origin: z.enum(CUSTOMER_ORIGINS as [string, ...string[]]),
  marketingOptIn: z.boolean().optional(),
});

export type CustomerUpsertByPhoneSchema = z.infer<typeof customerUpsertByPhoneSchema>;
