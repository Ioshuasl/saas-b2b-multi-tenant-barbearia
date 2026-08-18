import { Router } from 'express';
import { authenticateMiddleware } from '../../../../shared/middlewares/authenticate.middleware.js';
import { tenantContextMiddleware } from '../../../../shared/middlewares/tenant_context.middleware.js';
import type { LocationController } from '../../controllers/location.controller.js';

export function buildLocationRoutes(controller: LocationController): Router {
  const router = Router();
  router.get(
    '/locations/:id',
    (req, res, next) => {
      void authenticateMiddleware(req, res, next);
    },
    tenantContextMiddleware,
    (req, res, next) => {
      void controller.get(req, res).catch(next);
    },
  );
  return router;
}
