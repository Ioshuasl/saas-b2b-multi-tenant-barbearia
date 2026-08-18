import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.');

export const businessHoursSchema = z.object({
  slots: z.array(
    z.object({
      weekday: z.number().int().min(1).max(7),
      enabled: z.boolean(),
      startsAt: hhmm,
      endsAt: hhmm,
    }),
  ),
});
