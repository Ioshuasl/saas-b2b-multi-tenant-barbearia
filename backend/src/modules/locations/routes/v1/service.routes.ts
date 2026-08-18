import { Router } from 'express';
import { authorize, authorizeAny } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { ServiceController } from '../../controllers/service.controller.js';

export function buildServiceRoutes(controller: ServiceController): Router {
  const router = Router();
  const read = [authenticate, tenantContext, authorizeAny(['settings.read', 'agenda.read'])];
  const write = [authenticate, tenantContext, authorize('settings.write')];

  router.get('/services', ...read, (req, res, next) => {
    void controller.list(req, res).catch(next);
  });
  router.post('/services', ...write, (req, res, next) => {
    void controller.create(req, res).catch(next);
  });
  router.patch('/services/:id', ...write, (req, res, next) => {
    void controller.update(req, res).catch(next);
  });
  return router;
}
