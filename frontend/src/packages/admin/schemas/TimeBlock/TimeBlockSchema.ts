import { z } from 'zod';

export const timeBlockSchema = z.object({
  startsAt: z.string().min(1, 'Informe o início.'),
  endsAt: z.string().min(1, 'Informe o fim.'),
  reason: z.string().min(2, 'Informe o motivo.').max(80),
  rrule: z.string().max(200),
});
