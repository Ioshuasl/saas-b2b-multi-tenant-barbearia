import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import { parseBody } from '../helpers/http_parse.js';
import { requireCtx } from '../helpers/require_ctx.js';
import { requestMeta } from '../helpers/request_meta.js';
import {
  staffCreateSchema,
  staffInviteSchema,
  staffLocationsSchema,
  staffServicesSchema,
  staffUpdateSchema,
} from '../schemas/staff.schema.js';
import type { ListService } from '../services/staff/staff_list.service.js';
import type { CreateService } from '../services/staff/staff_create.service.js';
import type { UpdateService } from '../services/staff/staff_update.service.js';
import type { ReplaceLocationsService } from '../services/staff/staff_replace_locations.service.js';
import type { ReplaceServicesService } from '../services/staff/staff_replace_services.service.js';
import type { InviteService } from '../services/staff/staff_invite.service.js';

export class StaffController {
  constructor(
    private readonly listService: ListService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly replaceLocationsService: ReplaceLocationsService,
    private readonly replaceServicesService: ReplaceServicesService,
    private readonly inviteService: InviteService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const staff = await this.listService.execute(requireCtx(req));
    res.status(200).json({ data: staff });
  }

  async create(req: Request, res: Response): Promise<void> {
    const staffSchema = parseBody(staffCreateSchema, req.body);
    const staff = await this.createService.execute(requireCtx(req), staffSchema);
    res.status(201).json({ data: staff });
  }

  async update(req: Request, res: Response): Promise<void> {
    const staffId = req.params.id;
    if (!staffId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const staffSchema = parseBody(staffUpdateSchema, req.body);
    const staff = await this.updateService.execute(requireCtx(req), staffId, staffSchema);
    res.status(200).json({ data: staff });
  }

  async replaceLocations(req: Request, res: Response): Promise<void> {
    const staffId = req.params.id;
    if (!staffId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const staffLocationsSchemaParsed = parseBody(staffLocationsSchema, req.body);
    await this.replaceLocationsService.execute(requireCtx(req), staffId, staffLocationsSchemaParsed);
    res.status(200).json({ data: { ok: true } });
  }

  async replaceServices(req: Request, res: Response): Promise<void> {
    const staffId = req.params.id;
    if (!staffId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const staffServicesSchemaParsed = parseBody(staffServicesSchema, req.body);
    await this.replaceServicesService.execute(requireCtx(req), staffId, staffServicesSchemaParsed);
    res.status(200).json({ data: { ok: true } });
  }

  async invite(req: Request, res: Response): Promise<void> {
    const staffId = req.params.id;
    if (!staffId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const staffInviteSchemaParsed = parseBody(staffInviteSchema, req.body);
    const created = await this.inviteService.execute(
      requireCtx(req),
      staffId,
      staffInviteSchemaParsed,
      requestMeta(req),
    );
    res.status(201).json({ data: created });
  }
}
