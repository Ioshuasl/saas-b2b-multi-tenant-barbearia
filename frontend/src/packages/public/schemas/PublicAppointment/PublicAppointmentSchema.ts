import { z } from 'zod';
import { toPublicPhoneE164 } from '@/packages/public/helpers/PublicBookingPhone';

export const publicAppointmentBookSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome.').max(120, 'Nome muito longo.'),
  phone: z
    .string()
    .min(8, 'Informe o telefone.')
    .max(20, 'Telefone muito longo.')
    .refine((value) => toPublicPhoneE164(value) !== null, {
      message: 'Use DDD + número (ex.: 11999998888).',
    }),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((value) => value.length === 0 || z.string().email().safeParse(value).success, {
      message: 'E-mail inválido.',
    }),
  consentDataProcessing: z.boolean().refine((value) => value === true, {
    message: 'Consentimento para tratamento de dados é obrigatório.',
  }),
  consentWhatsappMarketing: z.boolean(),
  website: z.string().max(200),
  captchaToken: z.string().max(500),
});
