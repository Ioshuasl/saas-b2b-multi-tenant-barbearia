import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../domain/errors.js';

/** CSRF: cookie de refresh só é aceito com header customizado (docs/10). */
export function refreshCsrfMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('x-requested-with');
  if (!header) {
    next(new AppError('UNAUTHENTICATED', 'Cabeçalho de proteção ausente.', 401));
    return;
  }
  next();
}
