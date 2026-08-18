import { Router } from 'express';
import { authorize, authorizeAny } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { StaffController } from '../../controllers/staff.controller.js';

export function buildStaffRoutes(controller: StaffController): Router {
  const router = Router();
  const read = [authenticate, tenantContext, authorizeAny(['settings.read', 'agenda.read'])];
  const write = [authenticate, tenantContext, authorize('settings.write')];

  router.get('/staff', ...read, (req, res, next) => {
    void controller.list(req, res).catch(next);
  });
  router.post('/staff', ...write, (req, res, next) => {
    void controller.create(req, res).catch(next);
  });
  router.patch('/staff/:id', ...write, (req, res, next) => {
    void controller.update(req, res).catch(next);
  });
  router.put('/staff/:id/locations', ...write, (req, res, next) => {
    void controller.replaceLocations(req, res).catch(next);
  });
  router.put('/staff/:id/services', ...write, (req, res, next) => {
    void controller.replaceServices(req, res).catch(next);
  });
  router.post('/staff/:id/invite', ...write, (req, res, next) => {
    void controller.invite(req, res).catch(next);
  });
  return router;
}
