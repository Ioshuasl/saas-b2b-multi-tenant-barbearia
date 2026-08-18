import { z } from 'zod';

export const staffSchema = z.object({
  name: z.string().min(2, 'Informe o nome.').max(80),
  homeLocationId: z.string().uuid('Selecione a unidade.'),
  bio: z.string().max(500),
  commissionPercent: z.coerce.number().min(0).max(100),
  acceptsOnlineBooking: z.boolean(),
  active: z.boolean(),
  locationIds: z.array(z.string().uuid()),
  serviceIds: z.array(z.string().uuid()),
});

export const staffInviteSchema = z.object({
  email: z.string().email('E-mail inválido.').max(254),
});
