import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import { parseBody, parseQuery } from '../helpers/http_parse.js';
import { requireCtx } from '../helpers/require_ctx.js';
import {
  locationCreateSchema,
  locationUpdateSchema,
} from '../schemas/location.schema.js';
import { slugQuerySchema } from '../schemas/tenant.schema.js';
import type { ListService } from '../services/location/location_list.service.js';
import type { GetService } from '../services/location/location_get.service.js';
import type { CreateService } from '../services/location/location_create.service.js';
import type { UpdateService } from '../services/location/location_update.service.js';
import type { SlugAvailableService } from '../services/location/location_slug_available.service.js';

export class LocationController {
  constructor(
    private readonly listService: ListService,
    private readonly getService: GetService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly slugAvailableService: SlugAvailableService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const locations = await this.listService.execute(requireCtx(req));
    res.status(200).json({ data: locations });
  }

  async get(req: Request, res: Response): Promise<void> {
    const locationId = req.params.id;
    if (!locationId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const location = await this.getService.execute(requireCtx(req), locationId);
    res.status(200).json({ data: location });
  }

  async create(req: Request, res: Response): Promise<void> {
    const locationSchema = parseBody(locationCreateSchema, req.body);
    const location = await this.createService.execute(requireCtx(req), locationSchema);
    res.status(201).json({ data: location });
  }

  async update(req: Request, res: Response): Promise<void> {
    const locationId = req.params.id;
    if (!locationId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const locationSchema = parseBody(locationUpdateSchema, req.body);
    const location = await this.updateService.execute(requireCtx(req), locationId, locationSchema);
    res.status(200).json({ data: location });
  }

  async slugAvailable(req: Request, res: Response): Promise<void> {
    const locationId = req.params.id;
    if (!locationId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const slugQuery = parseQuery(slugQuerySchema, req.query);
    const result = await this.slugAvailableService.execute(
      requireCtx(req),
      slugQuery.slug,
      locationId,
    );
    res.status(200).json({ data: result });
  }
}
