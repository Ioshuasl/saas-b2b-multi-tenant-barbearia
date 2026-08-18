import { Router } from 'express';
import { authorize, authorizeAny } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { BusinessHoursController } from '../../controllers/business_hours.controller.js';

export function buildBusinessHoursRoutes(controller: BusinessHoursController): Router {
  const router = Router();
  const read = [authenticate, tenantContext, authorizeAny(['settings.read', 'agenda.read'])];
  const write = [authenticate, tenantContext, authorize('settings.write')];

  router.get('/business-hours', ...read, (req, res, next) => {
    void controller.list(req, res).catch(next);
  });
  router.put('/business-hours', ...write, (req, res, next) => {
    void controller.replace(req, res).catch(next);
  });
  return router;
}
