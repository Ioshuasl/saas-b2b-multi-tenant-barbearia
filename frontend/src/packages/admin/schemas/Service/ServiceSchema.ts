import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(2, 'Informe o nome.').max(80),
  description: z.string().max(500),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  priceReais: z.coerce.number().min(0),
  visibleOnline: z.boolean(),
  active: z.boolean(),
});
