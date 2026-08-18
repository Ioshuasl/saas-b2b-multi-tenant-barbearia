import { z } from 'zod';

export const timeBlockListQuerySchema = z.object({
  locationId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
});

export type TimeBlockListQuerySchema = z.infer<typeof timeBlockListQuerySchema>;

export const timeBlockCreateSchema = z.object({
  locationId: z.string().uuid(),
  staffId: z.string().uuid().nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().min(2).max(80).transform((v) => v.trim()),
  rrule: z.string().max(200).optional(),
});

export type TimeBlockCreateSchema = z.infer<typeof timeBlockCreateSchema>;
