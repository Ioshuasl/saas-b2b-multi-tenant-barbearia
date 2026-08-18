import type { RequestHandler } from 'express';
import { authenticateMiddleware } from '../../../shared/middlewares/authenticate.middleware.js';
import { tenantContextMiddleware } from '../../../shared/middlewares/tenant_context.middleware.js';

export const authenticate: RequestHandler = (req, res, next) => {
  void authenticateMiddleware(req, res, next);
};

export const tenantContext: RequestHandler = (req, res, next) => {
  void tenantContextMiddleware(req, res, next);
};
