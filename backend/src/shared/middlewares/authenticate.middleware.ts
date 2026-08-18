import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../auth/jwt.js';
import type { RequestContext } from '../domain/request_context.js';
import { AppError } from '../domain/errors.js';

export type AuthContext = {
  userId: string;
  tenantId: string;
  role: string;
  locationScope: RequestContext['locationScope'];
  locationIds: readonly string[];
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express augmentation API
  namespace Express {
    interface Request {
      auth?: AuthContext;
      ctx?: RequestContext;
    }
  }
}

export async function authenticateMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
    }

    const claims = await verifyAccessToken(token);

    req.auth = {
      userId: claims.sub,
      tenantId: claims.tenantId,
      role: claims.role,
      locationScope: claims.locationScope,
      locationIds: claims.locationIds,
    };

    req.ctx = {
      tenantId: claims.tenantId,
      userId: claims.sub,
      requestId: req.requestId,
      role: claims.role,
      locationScope: claims.locationScope,
      locationIds: claims.locationIds,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError('UNAUTHENTICATED', 'Token de acesso inválido ou expirado.', 401));
  }
}
