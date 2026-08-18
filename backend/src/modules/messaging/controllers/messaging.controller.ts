import type { Request, Response } from 'express';
import { parseBody } from '../helpers/http_parse.js';
import { requireCtx } from '../helpers/require_ctx.js';
import { messagingAccountCreateSchema } from '../schemas/account.schema.js';
import type { GetService } from '../services/account/account_get.service.js';
import type { CreateService } from '../services/account/account_create.service.js';
import type { QrService } from '../services/account/account_qr.service.js';
import type { DeleteService } from '../services/account/account_delete.service.js';

export class MessagingController {
  constructor(
    private readonly getService: GetService,
    private readonly createService: CreateService,
    private readonly qrService: QrService,
    private readonly deleteService: DeleteService,
  ) {}

  async getAccount(req: Request, res: Response): Promise<void> {
    const account = await this.getService.execute(requireCtx(req));
    res.status(200).json({ data: account });
  }

  async createAccount(req: Request, res: Response): Promise<void> {
    const accountSchema = parseBody(messagingAccountCreateSchema, req.body);
    const account = await this.createService.execute(requireCtx(req), accountSchema);
    res.status(200).json({ data: account });
  }

  async getQr(req: Request, res: Response): Promise<void> {
    const qr = await this.qrService.execute(requireCtx(req));
    res.status(200).json({ data: qr });
  }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    const account = await this.deleteService.execute(requireCtx(req));
    res.status(200).json({ data: account });
  }
}
