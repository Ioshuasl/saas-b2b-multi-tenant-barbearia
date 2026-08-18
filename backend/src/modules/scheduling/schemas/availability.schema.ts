import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  locationId: z.string().uuid(),
  serviceIds: z
    .string()
    .min(1)
    .transform((value) => value.split(',').map((id) => id.trim()).filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(1)),
  staffId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type AvailabilityQuerySchema = z.infer<typeof availabilityQuerySchema>;
