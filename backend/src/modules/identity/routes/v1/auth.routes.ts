import { Router } from 'express';
import { authenticateMiddleware } from '../../../../shared/middlewares/authenticate.middleware.js';
import { tenantContextMiddleware } from '../../../../shared/middlewares/tenant_context.middleware.js';
import { refreshCsrfMiddleware } from '../../../../shared/middlewares/refresh_csrf.middleware.js';
import type { AuthController } from '../../controllers/auth.controller.js';

export function buildAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/auth/signup', (req, res, next) => {
    void controller.signup(req, res).catch(next);
  });
  router.post('/auth/login', (req, res, next) => {
    void controller.login(req, res).catch(next);
  });
  router.post('/auth/refresh', refreshCsrfMiddleware, (req, res, next) => {
    void controller.refresh(req, res).catch(next);
  });
  router.post('/auth/logout', refreshCsrfMiddleware, (req, res, next) => {
    void controller.logout(req, res).catch(next);
  });
  router.post('/auth/logout-all', refreshCsrfMiddleware, (req, res, next) => {
    void controller.logoutAll(req, res).catch(next);
  });
  router.post('/auth/password/forgot', (req, res, next) => {
    void controller.forgot(req, res).catch(next);
  });
  router.post('/auth/password/reset', (req, res, next) => {
    void controller.reset(req, res).catch(next);
  });
  router.post('/auth/verify-email', (req, res, next) => {
    void controller.verifyEmail(req, res).catch(next);
  });
  router.get(
    '/auth/me',
    (req, res, next) => {
      void authenticateMiddleware(req, res, next);
    },
    tenantContextMiddleware,
    (req, res, next) => {
      void controller.me(req, res).catch(next);
    },
  );

  return router;
}
