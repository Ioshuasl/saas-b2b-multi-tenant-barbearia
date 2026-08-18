import { Router } from 'express';
import { authorize, authorizeAny, requireRole } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { LocationController } from '../../controllers/location.controller.js';
import type { ServiceController } from '../../controllers/service.controller.js';

export function buildLocationRoutes(
  controller: LocationController,
  serviceController: ServiceController,
): Router {
  const router = Router();
  const read = [authenticate, tenantContext, authorizeAny(['settings.read', 'agenda.read'])];
  const write = [authenticate, tenantContext, authorize('settings.write')];
  const ownerWrite = [authenticate, tenantContext, requireRole('OWNER')];

  router.get('/locations', ...read, (req, res, next) => {
    void controller.list(req, res).catch(next);
  });
  router.post('/locations', ...ownerWrite, (req, res, next) => {
    void controller.create(req, res).catch(next);
  });
  router.get('/locations/:id/slug-available', ...read, (req, res, next) => {
    void controller.slugAvailable(req, res).catch(next);
  });
  router.get('/locations/:id', ...read, (req, res, next) => {
    void controller.get(req, res).catch(next);
  });
  router.patch('/locations/:id', ...write, (req, res, next) => {
    void controller.update(req, res).catch(next);
  });
  router.put('/locations/:id/services/:serviceId', ...write, (req, res, next) => {
    void serviceController.upsertLocation(req, res).catch(next);
  });
  return router;
}
