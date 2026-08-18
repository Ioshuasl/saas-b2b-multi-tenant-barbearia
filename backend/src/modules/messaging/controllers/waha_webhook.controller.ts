import type { Request, Response } from 'express';
import type { HandleWahaWebhookService } from '../services/webhook/handle_waha_webhook.service.js';

export class WahaWebhookController {
  constructor(private readonly handleWebhookService: HandleWahaWebhookService) {}

  async handle(req: Request, res: Response): Promise<void> {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
    const signature = req.header('X-Webhook-Hmac') ?? undefined;
    await this.handleWebhookService.execute(rawBody, signature);
    res.status(200).json({ data: { ok: true } });
  }
}
