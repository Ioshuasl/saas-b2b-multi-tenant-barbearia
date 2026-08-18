import { Router } from 'express';
import { authenticateMiddleware } from '../../../../shared/middlewares/authenticate.middleware.js';
import { tenantContextMiddleware } from '../../../../shared/middlewares/tenant_context.middleware.js';
import { authorize } from '../../../../shared/middlewares/authorize.middleware.js';
import type { UserController } from '../../controllers/user.controller.js';

export function buildUserRoutes(controller: UserController): Router {
  const router = Router();

  router.get(
    '/users',
    (req, res, next) => {
      void authenticateMiddleware(req, res, next);
    },
    tenantContextMiddleware,
    authorize('users.manage'),
    (req, res, next) => {
      void controller.list(req, res).catch(next);
    },
  );
  router.patch(
    '/users/:id',
    (req, res, next) => {
      void authenticateMiddleware(req, res, next);
    },
    tenantContextMiddleware,
    authorize('users.manage'),
    (req, res, next) => {
      void controller.update(req, res).catch(next);
    },
  );
  router.post(
    '/users/invitations',
    (req, res, next) => {
      void authenticateMiddleware(req, res, next);
    },
    tenantContextMiddleware,
    authorize('users.manage'),
    (req, res, next) => {
      void controller.createInvitation(req, res).catch(next);
    },
  );
  router.get(
    '/users/invitations',
    (req, res, next) => {
      void authenticateMiddleware(req, res, next);
    },
    tenantContextMiddleware,
    authorize('users.manage'),
    (req, res, next) => {
      void controller.listInvitations(req, res).catch(next);
    },
  );
  router.post('/users/invitations/accept', (req, res, next) => {
    void controller.acceptInvitation(req, res).catch(next);
  });
  router.post(
    '/users/invitations/:id/resend',
    (req, res, next) => {
      void authenticateMiddleware(req, res, next);
    },
    tenantContextMiddleware,
    authorize('users.manage'),
    (req, res, next) => {
      void controller.resendInvitation(req, res).catch(next);
    },
  );
  router.delete(
    '/users/invitations/:id',
    (req, res, next) => {
      void authenticateMiddleware(req, res, next);
    },
    tenantContextMiddleware,
    authorize('users.manage'),
    (req, res, next) => {
      void controller.deleteInvitation(req, res).catch(next);
    },
  );

  return router;
}
