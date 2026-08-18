import type { Request, Response } from 'express';
import { parseBody, parseQuery } from '../helpers/http_parse.js';
import { requireCtx } from '../helpers/require_ctx.js';
import {
  businessHoursQuerySchema,
  businessHoursReplaceSchema,
} from '../schemas/business_hours.schema.js';
import type { ListService } from '../services/business_hours/business_hours_list.service.js';
import type { ReplaceService } from '../services/business_hours/business_hours_replace.service.js';

export class BusinessHoursController {
  constructor(
    private readonly listService: ListService,
    private readonly replaceService: ReplaceService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = parseQuery(businessHoursQuerySchema, req.query);
    const hours = await this.listService.execute(
      requireCtx(req),
      query.locationId,
      query.staffId ?? null,
    );
    res.status(200).json({ data: hours });
  }

  async replace(req: Request, res: Response): Promise<void> {
    const businessHoursSchema = parseBody(businessHoursReplaceSchema, req.body);
    const hours = await this.replaceService.execute(requireCtx(req), businessHoursSchema);
    res.status(200).json({ data: hours });
  }
}
