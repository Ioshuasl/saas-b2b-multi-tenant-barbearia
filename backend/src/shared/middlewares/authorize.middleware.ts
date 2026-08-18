import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../domain/errors.js';
import { writeAuditLogSafe, AuditAction } from '../database/write_audit.js';
import {
  authorize as authorizeActor,
  type Permission,
} from '../../modules/identity/identity_public.js';

export function authorize(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.ctx) {
      next(new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401));
      return;
    }

    try {
      authorizeActor(req.ctx, permission);
      next();
    } catch (err) {
      deny(req, permission, err, next);
    }
  };
}

export function authorizeAny(permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.ctx) {
      next(new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401));
      return;
    }

    for (const permission of permissions) {
      try {
        authorizeActor(req.ctx, permission);
        next();
        return;
      } catch {
        // tenta a próxima
      }
    }
    deny(req, permissions[0] ?? 'settings.read', new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', 403), next);
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.ctx) {
      next(new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401));
      return;
    }
    if (!roles.includes(req.ctx.role)) {
      deny(
        req,
        'settings.write',
        new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', 403),
        next,
      );
      return;
    }
    next();
  };
}

function deny(req: Request, permission: Permission, err: unknown, next: NextFunction): void {
  void writeAuditLogSafe({
    tenantId: req.ctx?.tenantId ?? '',
    actorUserId: req.ctx?.userId,
    action: AuditAction.PERMISSION_DENIED,
    resourceType: 'permission',
    metadata: { permission },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });
  next(err);
}
