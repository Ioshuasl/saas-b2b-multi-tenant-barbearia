import { Router } from 'express';
import { authorize, authorizeAny } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { TimeBlockController } from '../../controllers/time_block.controller.js';

export function buildTimeBlockRoutes(controller: TimeBlockController): Router {
  const router = Router();
  const read = [authenticate, tenantContext, authorizeAny(['settings.read', 'agenda.read'])];
  const write = [authenticate, tenantContext, authorize('settings.write')];

  router.get('/time-blocks', ...read, (req, res, next) => {
    void controller.list(req, res).catch(next);
  });
  router.post('/time-blocks', ...write, (req, res, next) => {
    void controller.create(req, res).catch(next);
  });
  router.delete('/time-blocks/:id', ...write, (req, res, next) => {
    void controller.delete(req, res).catch(next);
  });
  return router;
}
