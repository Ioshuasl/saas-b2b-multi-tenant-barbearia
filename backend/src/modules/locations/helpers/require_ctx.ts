import type { Request } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import type { RequestContext } from '../../../shared/domain/request_context.js';

export function requireCtx(req: Request): RequestContext {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401);
  }
  return req.ctx;
}
