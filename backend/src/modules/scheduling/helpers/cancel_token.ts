import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

export function generateCancelToken(): string {
  return randomUUID();
}

export function hashCancelToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verifyCancelToken(token: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const candidate = hashCancelToken(token);
  const left = Buffer.from(candidate, 'utf8');
  const right = Buffer.from(storedHash, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
