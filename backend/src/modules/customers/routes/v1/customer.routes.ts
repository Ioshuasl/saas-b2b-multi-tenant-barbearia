import { Router } from 'express';
import { authorize } from '../../../../shared/middlewares/authorize.middleware.js';
import { authenticate, tenantContext } from '../../helpers/route_auth.js';
import type { CustomerController } from '../../controllers/customer.controller.js';

export function buildCustomerRoutes(controller: CustomerController): Router {
  const router = Router();
  const read = [authenticate, tenantContext, authorize('customers.read')];
  const write = [authenticate, tenantContext, authorize('customers.write')];

  router.get('/customers/check-duplicate', ...read, (req, res, next) => {
    void controller.checkDuplicate(req, res).catch(next);
  });

  router.get('/customers', ...read, (req, res, next) => {
    void controller.list(req, res).catch(next);
  });

  router.post('/customers', ...write, (req, res, next) => {
    void controller.create(req, res).catch(next);
  });

  router.get('/customers/:id/appointments', ...read, (req, res, next) => {
    void controller.listAppointments(req, res).catch(next);
  });

  router.get('/customers/:id', ...read, (req, res, next) => {
    void controller.get(req, res).catch(next);
  });

  router.patch('/customers/:id', ...write, (req, res, next) => {
    void controller.update(req, res).catch(next);
  });

  router.delete('/customers/:id', ...write, (req, res, next) => {
    void controller.delete(req, res).catch(next);
  });

  return router;
}
