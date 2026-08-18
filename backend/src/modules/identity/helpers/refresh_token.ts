import { createHash, randomBytes } from 'node:crypto';

export function generateRefreshSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}
