import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(2, 'Informe o nome.').max(80),
  slug: z.string().max(48),
  timezone: z.string().min(3).max(64),
  phone: z.string().max(20),
  email: z.string().max(254),
  city: z.string().max(80),
  state: z.string().max(2),
  street: z.string().max(120),
  active: z.boolean(),
  isDefault: z.boolean(),
});
