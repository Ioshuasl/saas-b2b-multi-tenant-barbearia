import { z } from 'zod';
import { messagingAccountCreateSchema } from '@repo/contracts';

export const messagingAccountSchema = messagingAccountCreateSchema.refine(
  (value) => value.riskAccepted === true,
  {
    message: 'Confirme a ciência de risco antes de conectar.',
    path: ['riskAccepted'],
  },
);

export type MessagingAccountFormValues = z.infer<typeof messagingAccountSchema>;
