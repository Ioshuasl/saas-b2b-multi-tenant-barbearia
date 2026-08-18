import { ApiClientError } from '@/shared/api/api-client';

export function isPublicNotFoundError(err: unknown): boolean {
  return (
    err instanceof ApiClientError &&
    (err.status === 404 || err.code === 'NOT_FOUND' || err.code === 'INVALID_CANCEL_TOKEN')
  );
}
