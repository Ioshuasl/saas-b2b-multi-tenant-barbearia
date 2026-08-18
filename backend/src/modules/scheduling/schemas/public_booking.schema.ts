import { z } from 'zod';
import { normalizePhoneE164 } from '../../customers/customers_public.js';

const phoneSchema = z
  .string()
  .min(8)
  .max(20)
  .transform((value) => normalizePhoneE164(value));

export const publicBookSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1),
  staffId: z.string().uuid().nullable().optional(),
  startsAt: z.string().datetime(),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: phoneSchema,
    email: z.string().trim().email().optional(),
  }),
  consentDataProcessing: z.boolean(),
  consentWhatsappMarketing: z.boolean().optional().default(false),
  website: z.string().max(200).optional(),
  captchaToken: z.string().max(500).optional(),
});

export type PublicBookSchema = z.infer<typeof publicBookSchema>;

export const publicRescheduleSchema = z.object({
  startsAt: z.string().datetime(),
  staffId: z.string().uuid().nullable().optional(),
  serviceIds: z.array(z.string().uuid()).min(1).optional(),
  captchaToken: z.string().max(500).optional(),
});

export type PublicRescheduleSchema = z.infer<typeof publicRescheduleSchema>;

export const publicCancelSchema = z.object({
  reason: z.string().min(2).max(500).optional(),
});

export type PublicCancelSchema = z.infer<typeof publicCancelSchema>;

export const publicTokenQuerySchema = z.object({
  token: z.string().uuid(),
});

export type PublicTokenQuerySchema = z.infer<typeof publicTokenQuerySchema>;
