import type { NextFunction, Request, Response } from 'express';
import { AppError, NotFoundError } from '../domain/errors.js';

/**
 * Resolve unidade ativa a partir de `X-Location-Id` (docs/06).
 * Fora do escopo → 404 (não revela existência).
 */
export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401));
    return;
  }

  const requestedLocationId = req.header('x-location-id');
  if (
    requestedLocationId &&
    req.auth.locationScope !== 'ALL' &&
    !req.auth.locationIds.includes(requestedLocationId)
  ) {
    next(new NotFoundError());
    return;
  }

  req.ctx = {
    tenantId: req.auth.tenantId,
    userId: req.auth.userId,
    requestId: req.requestId,
    role: req.auth.role,
    locationId: requestedLocationId ?? undefined,
    locationScope: req.auth.locationScope,
    locationIds: req.auth.locationIds,
  };

  next();
}
