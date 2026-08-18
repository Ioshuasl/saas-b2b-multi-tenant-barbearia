import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { buildIdentityRouter } from '../modules/identity/identity.module.js';
import { buildLocationsRouter } from '../modules/locations/locations.module.js';
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
  return api;
}
