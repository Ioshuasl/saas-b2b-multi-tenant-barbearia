import { z } from 'zod';
import { CUSTOMER_ORIGINS } from '@/packages/operacional/enum/Customer/CustomerOriginEnum';

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function tryNormalizePhoneE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  const candidate = trimmed.startsWith('+')
    ? `+${digits}`
    : digits.startsWith('55') && digits.length >= 12 && digits.length <= 13
      ? `+${digits}`
      : digits.length === 10 || digits.length === 11
        ? `+55${digits}`
        : null;
  if (!candidate || !E164_PATTERN.test(candidate)) return null;
  return candidate;
}

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome.').max(120),
  phone: z
    .string()
    .trim()
    .min(1, 'Informe o telefone.')
    .transform((value, ctx) => {
      const normalized = tryNormalizePhoneE164(value);
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Telefone inválido. Use DDD + número ou formato internacional.',
        });
        return z.NEVER;
      }
      return normalized;
    }),
  email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
  marketingOptIn: z.boolean(),
  origin: z.enum(CUSTOMER_ORIGINS).optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
