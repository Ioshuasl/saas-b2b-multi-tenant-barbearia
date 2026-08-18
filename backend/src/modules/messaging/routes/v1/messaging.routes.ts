import { Router } from 'express';
import { authorize } from '../../../../shared/middlewares/authorize.middleware.js';
import { requireRole } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { MessagingController } from '../../controllers/messaging.controller.js';

export function buildMessagingRoutes(controller: MessagingController): Router {
  const router = Router();
  const ownerRead = [authenticate, tenantContext, requireRole('OWNER'), authorize('messaging.read')];
  const ownerConfigure = [
    authenticate,
    tenantContext,
    requireRole('OWNER'),
    authorize('messaging.configure'),
  ];

  router.get('/messaging/account', ...ownerRead, (req, res, next) => {
    void controller.getAccount(req, res).catch(next);
  });

  router.post('/messaging/account', ...ownerConfigure, (req, res, next) => {
    void controller.createAccount(req, res).catch(next);
  });

  router.get('/messaging/account/qr', ...ownerConfigure, (req, res, next) => {
    void controller.getQr(req, res).catch(next);
  });

  router.delete('/messaging/account', ...ownerConfigure, (req, res, next) => {
    void controller.deleteAccount(req, res).catch(next);
  });

  return router;
}
