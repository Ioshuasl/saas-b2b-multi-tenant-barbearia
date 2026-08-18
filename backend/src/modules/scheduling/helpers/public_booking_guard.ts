import { AppError } from '../../../shared/domain/errors.js';
import { clientIp } from '../../../shared/middlewares/rate_limit.middleware.js';
import type { Request } from 'express';

const FAIL_THRESHOLD = 5;
const failuresByIp = new Map<string, number>();

export function assertHoneypot(body: { website?: string }): void {
  const trap = body.website;
  if (typeof trap === 'string' && trap.trim().length > 0) {
    throw new AppError('VALIDATION_ERROR', 'Requisição inválida.', 400);
  }
}

export function registerPublicBookingFailure(req: Request): void {
  const ip = clientIp(req);
  failuresByIp.set(ip, (failuresByIp.get(ip) ?? 0) + 1);
}

export function assertCaptchaIfRequired(req: Request, captchaToken?: string): void {
  const ip = clientIp(req);
  const failures = failuresByIp.get(ip) ?? 0;
  if (failures < FAIL_THRESHOLD) return;
  if (!captchaToken || captchaToken.trim().length === 0) {
    throw new AppError('CAPTCHA_REQUIRED', 'Confirme o captcha para continuar.', 422);
  }
}

export function resetPublicBookingFailures(req: Request): void {
  failuresByIp.delete(clientIp(req));
}
