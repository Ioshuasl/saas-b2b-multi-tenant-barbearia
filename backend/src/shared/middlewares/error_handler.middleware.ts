import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorBody } from '@repo/contracts';
import { AppError } from '../domain/errors.js';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    };
    res.status(err.status).json(body);
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status?: number }).status === 400 &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.parse.failed'
  ) {
    const body: ApiErrorBody = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'JSON inválido.',
        requestId,
      },
    };
    res.status(400).json(body);
    return;
  }

  logger.error({ err, requestId }, 'unhandled_error');
  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno inesperado.',
      requestId,
    },
  };
  res.status(500).json(body);
}
