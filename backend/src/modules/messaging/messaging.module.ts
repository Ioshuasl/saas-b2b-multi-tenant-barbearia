import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { MessagingController } from './controllers/messaging.controller.js';
import { WahaWebhookController } from './controllers/waha_webhook.controller.js';
import { buildMessagingRoutes } from './routes/v1/messaging.routes.js';
import { buildWahaWebhookRoutes } from './routes/v1/waha_webhook.routes.js';
import { GetRepository } from './repositories/account/account_get.repository.js';
import { UpsertRepository } from './repositories/account/account_upsert.repository.js';
import { UpdateStatusRepository } from './repositories/account/account_update_status.repository.js';
import { DisconnectRepository } from './repositories/account/account_disconnect.repository.js';
import { ResolveBySessionRepository } from './repositories/account/account_resolve_by_session.repository.js';
import { InsertWebhookEventRepository } from './repositories/webhook/webhook_event_insert.repository.js';
import { GetService } from './services/account/account_get.service.js';
import { CreateService } from './services/account/account_create.service.js';
import { QrService } from './services/account/account_qr.service.js';
import { DeleteService } from './services/account/account_delete.service.js';
import { HandleWahaWebhookService } from './services/webhook/handle_waha_webhook.service.js';
import { getMessagingProvider } from './helpers/provider_factory.js';

export function buildMessagingRouter(): Router {
  const messagingProvider = getMessagingProvider();

  const getRepository = new GetRepository();
  const upsertRepository = new UpsertRepository();
  const updateStatusRepository = new UpdateStatusRepository();
  const disconnectRepository = new DisconnectRepository();
  const resolveBySessionRepository = new ResolveBySessionRepository();
  const insertWebhookEventRepository = new InsertWebhookEventRepository();

  const controller = new MessagingController(
    new GetService(getRepository),
    new CreateService(upsertRepository, updateStatusRepository, messagingProvider),
    new QrService(getRepository, updateStatusRepository, messagingProvider),
    new DeleteService(getRepository, disconnectRepository, messagingProvider),
  );

  const router = createRouter();
  router.use(buildMessagingRoutes(controller));
  return router;
}

export function buildWahaWebhookRouter(): Router {
  const resolveBySessionRepository = new ResolveBySessionRepository();
  const insertWebhookEventRepository = new InsertWebhookEventRepository();
  const updateStatusRepository = new UpdateStatusRepository();

  const webhookController = new WahaWebhookController(
    new HandleWahaWebhookService(
      resolveBySessionRepository,
      insertWebhookEventRepository,
      updateStatusRepository,
    ),
  );

  const router = createRouter();
  router.use(buildWahaWebhookRoutes(webhookController));
  return router;
}
