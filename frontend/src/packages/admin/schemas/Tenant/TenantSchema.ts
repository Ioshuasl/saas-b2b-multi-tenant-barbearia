import { z } from 'zod';

export const tenantSchema = z.object({
  name: z.string().min(2, 'Informe o nome.').max(80),
  slug: z
    .string()
    .min(2, 'Informe o slug.')
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífen.'),
  logoUrl: z.string().max(500),
  brandColor: z.string().max(7),
});
