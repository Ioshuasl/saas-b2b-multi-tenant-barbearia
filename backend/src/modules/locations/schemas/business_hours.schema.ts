import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido (HH:mm).');

export const businessHoursQuerySchema = z.object({
  locationId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
});

export type BusinessHoursQuerySchema = z.infer<typeof businessHoursQuerySchema>;

export const businessHoursReplaceSchema = z.object({
  locationId: z.string().uuid(),
  staffId: z.string().uuid().nullable().optional(),
  slots: z
    .array(
      z.object({
        weekday: z.number().int().min(1).max(7),
        startsAt: hhmm,
        endsAt: hhmm,
      }),
    )
    .max(21),
});

export type BusinessHoursReplaceSchema = z.infer<typeof businessHoursReplaceSchema>;
