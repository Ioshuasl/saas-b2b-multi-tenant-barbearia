import { Router } from 'express';
import type { WahaWebhookController } from '../../controllers/waha_webhook.controller.js';

export function buildWahaWebhookRoutes(controller: WahaWebhookController): Router {
  const router = Router();

  router.post('/', (req, res, next) => {
    void controller.handle(req, res).catch(next);
  });

  return router;
}
