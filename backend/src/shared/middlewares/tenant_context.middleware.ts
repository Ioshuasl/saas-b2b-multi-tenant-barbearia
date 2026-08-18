import type { NextFunction, Request, Response } from 'express';
import { AppError, NotFoundError } from '../domain/errors.js';
import { assertLocationAccessible } from '../../modules/locations/locations_public.js';

/**
 * Resolve unidade ativa a partir de `X-Location-Id` (docs/06).
 * Fora do escopo → 404 (não revela existência).
 */
export function tenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void applyTenantContext(req, res, next);
}

async function applyTenantContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401);
    }

    const requestedLocationId = req.header('x-location-id');
    if (
      requestedLocationId &&
      req.auth.locationScope !== 'ALL' &&
      !req.auth.locationIds.includes(requestedLocationId)
    ) {
      throw new NotFoundError();
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

    if (requestedLocationId && req.ctx) {
      await assertLocationAccessible(req.ctx, requestedLocationId);
    }

    next();
  } catch (err) {
    next(err);
  }
}
