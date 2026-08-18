import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import { parseBody, parseQuery } from '../helpers/http_parse.js';
import { requireCtx } from '../helpers/require_ctx.js';
import { timeBlockCreateSchema, timeBlockListQuerySchema } from '../schemas/time_block.schema.js';
import type { ListService } from '../services/time_block/time_block_list.service.js';
import type { CreateService } from '../services/time_block/time_block_create.service.js';
import type { DeleteService } from '../services/time_block/time_block_delete.service.js';

export class TimeBlockController {
  constructor(
    private readonly listService: ListService,
    private readonly createService: CreateService,
    private readonly deleteService: DeleteService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = parseQuery(timeBlockListQuerySchema, req.query);
    const blocks = await this.listService.execute(requireCtx(req), query);
    res.status(200).json({ data: blocks });
  }

  async create(req: Request, res: Response): Promise<void> {
    const timeBlockSchema = parseBody(timeBlockCreateSchema, req.body);
    const block = await this.createService.execute(requireCtx(req), timeBlockSchema);
    res.status(201).json({ data: block });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const timeBlockId = req.params.id;
    if (!timeBlockId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    await this.deleteService.execute(requireCtx(req), timeBlockId);
    res.status(200).json({ data: { ok: true } });
  }
}
