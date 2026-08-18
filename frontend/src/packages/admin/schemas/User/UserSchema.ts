import { z } from 'zod';

export const userSchema = z.object({
  role: z.enum(['OWNER', 'MANAGER', 'STAFF', 'RECEPTIONIST']),
  active: z.boolean(),
  locationIds: z.array(z.string().uuid()),
});
