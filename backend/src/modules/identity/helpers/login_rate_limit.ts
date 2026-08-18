import { AppError } from '../../../shared/domain/errors.js';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;

const failures = new Map<string, number[]>();

function prune(key: string, windowStart: number): number[] {
  const stamps = (failures.get(key) ?? []).filter((t) => t > windowStart);
  failures.set(key, stamps);
  return stamps;
}

export function assertLoginNotRateLimited(ip: string, email: string): void {
  const key = `${ip}:${email.toLowerCase()}`;
  const stamps = prune(key, Date.now() - WINDOW_MS);
  if (stamps.length >= MAX_FAILURES) {
    throw new AppError(
      'RATE_LIMITED',
      'Muitas tentativas. Tente novamente em instantes.',
      429,
    );
  }
}

export function recordLoginFailure(ip: string, email: string): void {
  const key = `${ip}:${email.toLowerCase()}`;
  const stamps = prune(key, Date.now() - WINDOW_MS);
  stamps.push(Date.now());
  failures.set(key, stamps);
}

export function clearLoginFailures(ip: string, email: string): void {
  failures.delete(`${ip}:${email.toLowerCase()}`);
}
