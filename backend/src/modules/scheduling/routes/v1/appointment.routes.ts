import { Router } from 'express';
import { authorize, authorizeAny } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { AppointmentController } from '../../controllers/appointment.controller.js';

export function buildAppointmentRoutes(controller: AppointmentController): Router {
  const router = Router();
  const read = [authenticate, tenantContext, authorizeAny(['settings.read', 'agenda.read'])];
  const write = [authenticate, tenantContext, authorize('agenda.write')];

  router.get('/availability', ...read, (req, res, next) => {
    void controller.availability(req, res).catch(next);
  });
  router.get('/appointments', ...read, (req, res, next) => {
    void controller.list(req, res).catch(next);
  });
  router.post('/appointments', ...write, (req, res, next) => {
    void controller.create(req, res).catch(next);
  });
  router.get('/appointments/:id', ...read, (req, res, next) => {
    void controller.get(req, res).catch(next);
  });
  router.patch('/appointments/:id', ...write, (req, res, next) => {
    void controller.update(req, res).catch(next);
  });
  router.post('/appointments/:id/status', ...write, (req, res, next) => {
    void controller.status(req, res).catch(next);
  });
  router.delete('/appointments/:id', ...write, (req, res, next) => {
    void controller.delete(req, res).catch(next);
  });
  router.get('/appointments/:id/history', ...read, (req, res, next) => {
    void controller.history(req, res).catch(next);
  });

  return router;
}
