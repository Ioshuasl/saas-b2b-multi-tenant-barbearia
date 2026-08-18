import { z } from 'zod';

export const invitationSchema = z.object({
  email: z.string().email('E-mail inválido.').max(254),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF', 'RECEPTIONIST']),
  locationIds: z.array(z.string().uuid()),
});
