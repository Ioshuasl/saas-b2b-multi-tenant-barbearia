import { Router } from 'express';
import { clientIp, rateLimit } from '../../../../shared/middlewares/rate_limit.middleware.js';
import type { PublicBookingController } from '../../controllers/public_booking.controller.js';

export function buildPublicBookingRoutes(controller: PublicBookingController): Router {
  const router = Router();

  const ipLimit = rateLimit({
    windowMs: 60_000,
    max: 100,
    key: (req) => `public:booking:ip:${clientIp(req)}`,
  });

  const locationLimit = rateLimit({
    windowMs: 60_000,
    max: 200,
    key: (req) =>
      `public:booking:location:${req.params.tenantSlug ?? 'x'}/${req.params.locationSlug ?? 'x'}`,
  });

  const withLimits = [ipLimit, locationLimit];

  router.get('/public/:tenantSlug', ...withLimits, (req, res, next) => {
    void controller.tenant(req, res).catch(next);
  });

  router.get('/public/:tenantSlug/:locationSlug', ...withLimits, (req, res, next) => {
    void controller.location(req, res).catch(next);
  });

  router.get('/public/:tenantSlug/:locationSlug/availability', ...withLimits, (req, res, next) => {
    void controller.availability(req, res).catch(next);
  });

  router.post('/public/:tenantSlug/:locationSlug/appointments', ...withLimits, (req, res, next) => {
    void controller.book(req, res).catch(next);
  });

  router.get(
    '/public/:tenantSlug/:locationSlug/appointments/:id',
    ...withLimits,
    (req, res, next) => {
      void controller.getAppointment(req, res).catch(next);
    },
  );

  router.patch(
    '/public/:tenantSlug/:locationSlug/appointments/:id',
    ...withLimits,
    (req, res, next) => {
      void controller.updateAppointment(req, res).catch(next);
    },
  );

  router.delete(
    '/public/:tenantSlug/:locationSlug/appointments/:id',
    ...withLimits,
    (req, res, next) => {
      void controller.cancelAppointment(req, res).catch(next);
    },
  );

  return router;
}
