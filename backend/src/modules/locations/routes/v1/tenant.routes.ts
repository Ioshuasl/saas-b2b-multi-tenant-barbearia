import { Router } from 'express';
import { authorizeAny, requireRole } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { TenantController } from '../../controllers/tenant.controller.js';

export function buildTenantRoutes(controller: TenantController): Router {
  const router = Router();
  const read = [authenticate, tenantContext, authorizeAny(['settings.read', 'agenda.read'])];
  const owner = [authenticate, tenantContext, requireRole('OWNER')];

  router.get('/tenant/slug-available', ...read, (req, res, next) => {
    void controller.slugAvailable(req, res).catch(next);
  });
  router.get('/tenant/onboarding', ...read, (req, res, next) => {
    void controller.getOnboarding(req, res).catch(next);
  });
  router.patch('/tenant/onboarding', ...owner, (req, res, next) => {
    void controller.updateOnboarding(req, res).catch(next);
  });
  router.get('/tenant', ...read, (req, res, next) => {
    void controller.get(req, res).catch(next);
  });
  router.patch('/tenant', ...owner, (req, res, next) => {
    void controller.update(req, res).catch(next);
  });
  return router;
}
