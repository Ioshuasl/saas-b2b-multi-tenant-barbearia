import { AppError } from '../../../shared/domain/errors.js';
import type { z } from 'zod';

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Dados inválidos.',
      400,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        issue: issue.message,
      })),
    );
  }
  return parsed.data;
}
