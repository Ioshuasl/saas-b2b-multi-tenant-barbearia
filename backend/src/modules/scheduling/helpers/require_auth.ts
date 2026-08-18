import type { Request } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import type { AuthContext } from '../../../shared/middlewares/authenticate.middleware.js';

export function requireAuth(req: Request): AuthContext {
  if (!req.auth) {
    throw new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401);
  }
  return req.auth;
}
