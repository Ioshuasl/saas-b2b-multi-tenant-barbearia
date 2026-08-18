import { ApiClientError } from '@/shared/api/api-client';

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Não foi possível concluir. Tente de novo.';
}
