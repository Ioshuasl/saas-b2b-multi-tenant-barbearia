import { z } from 'zod';

export const serviceCreateSchema = z.object({
  name: z.string().min(2).max(80).transform((v) => v.trim()),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(5).max(480),
  bufferMinutes: z.number().int().min(0).max(120).optional(),
  priceCents: z.number().int().min(0).max(10_000_000).optional(),
  color: z.string().max(32).optional(),
  visibleOnline: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export type ServiceCreateSchema = z.infer<typeof serviceCreateSchema>;

export const serviceUpdateSchema = z
  .object({
    name: z.string().min(2).max(80).transform((v) => v.trim()).optional(),
    description: z.string().max(500).nullable().optional(),
    durationMinutes: z.number().int().min(5).max(480).optional(),
    bufferMinutes: z.number().int().min(0).max(120).optional(),
    priceCents: z.number().int().min(0).max(10_000_000).optional(),
    color: z.string().max(32).nullable().optional(),
    active: z.boolean().optional(),
    visibleOnline: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Informe ao menos um campo.' });

export type ServiceUpdateSchema = z.infer<typeof serviceUpdateSchema>;

export const locationServiceUpsertSchema = z.object({
  active: z.boolean(),
  priceCentsOverride: z.number().int().min(0).max(10_000_000).nullable().optional(),
  durationMinutesOverride: z.number().int().min(5).max(480).nullable().optional(),
});

export type LocationServiceUpsertSchema = z.infer<typeof locationServiceUpsertSchema>;
