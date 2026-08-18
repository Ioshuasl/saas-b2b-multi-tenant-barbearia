import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { buildIdentityRouter } from '../modules/identity/identity.module.js';
import { buildLocationsRouter } from '../modules/locations/locations.module.js';
import { buildCustomersRouter } from '../modules/customers/customers.module.js';
import { buildSchedulingRouter } from '../modules/scheduling/scheduling.module.js';
import { buildMessagingRouter } from '../modules/messaging/messaging.module.js';
import { clientIp, rateLimit } from '../shared/middlewares/rate_limit.middleware.js';

/** Monta rotas versionadas em `/api/v1`. */
export function buildApiRouter(): Router {
  const api = Router();
  api.use(
    rateLimit({
      windowMs: 60_000,
      max: 300,
      key: (req) => clientIp(req),
    }),
  );
  api.use(healthRoutes);
  api.use(buildIdentityRouter());
  api.use(buildLocationsRouter());
  api.use(buildCustomersRouter());
  api.use(buildSchedulingRouter());
  api.use(buildMessagingRouter());
  return api;
}
