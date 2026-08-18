import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import { parseBody } from '../helpers/http_parse.js';
import { requestMeta } from '../helpers/request_meta.js';
import {
  invitationAcceptSchema,
  invitationCreateSchema,
  userUpdateSchema,
} from '../schemas/user.schema.js';
import type { ListService as UserListService } from '../services/user/user_list.service.js';
import type { UpdateService } from '../services/user/user_update.service.js';
import type { CreateService } from '../services/invitation/invitation_create.service.js';
import type { ListService as InvitationListService } from '../services/invitation/invitation_list.service.js';
import type { DeleteService } from '../services/invitation/invitation_delete.service.js';
import type { ResendService } from '../services/invitation/invitation_resend.service.js';
import type { AcceptService } from '../services/invitation/invitation_accept.service.js';

export class UserController {
  constructor(
    private readonly userListService: UserListService,
    private readonly updateService: UpdateService,
    private readonly invitationCreateService: CreateService,
    private readonly invitationListService: InvitationListService,
    private readonly invitationDeleteService: DeleteService,
    private readonly invitationResendService: ResendService,
    private readonly invitationAcceptService: AcceptService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const ctx = requireCtx(req);
    const users = await this.userListService.execute(ctx);
    res.status(200).json({ data: users });
  }

  async update(req: Request, res: Response): Promise<void> {
    const ctx = requireCtx(req);
    const userId = req.params.id;
    if (!userId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const userSchema = parseBody(userUpdateSchema, req.body);
    await this.updateService.execute(ctx, userId, userSchema, requestMeta(req));
    res.status(200).json({ data: { ok: true } });
  }

  async createInvitation(req: Request, res: Response): Promise<void> {
    const ctx = requireCtx(req);
    const invitationSchema = parseBody(invitationCreateSchema, req.body);
    const created = await this.invitationCreateService.execute(
      ctx,
      { ...invitationSchema, locationIds: invitationSchema.locationIds ?? [] },
      requestMeta(req),
    );
    res.status(201).json({ data: created });
  }

  async listInvitations(req: Request, res: Response): Promise<void> {
    const ctx = requireCtx(req);
    const invitations = await this.invitationListService.execute(ctx);
    res.status(200).json({ data: invitations });
  }

  async deleteInvitation(req: Request, res: Response): Promise<void> {
    const ctx = requireCtx(req);
    const invitationId = req.params.id;
    if (!invitationId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    await this.invitationDeleteService.execute(ctx, invitationId);
    res.status(200).json({ data: { ok: true } });
  }

  async resendInvitation(req: Request, res: Response): Promise<void> {
    const ctx = requireCtx(req);
    const invitationId = req.params.id;
    if (!invitationId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    await this.invitationResendService.execute(ctx, invitationId, requestMeta(req));
    res.status(200).json({ data: { ok: true } });
  }

  async acceptInvitation(req: Request, res: Response): Promise<void> {
    const invitationAcceptSchemaParsed = parseBody(invitationAcceptSchema, req.body);
    await this.invitationAcceptService.execute(invitationAcceptSchemaParsed);
    res.status(200).json({ data: { ok: true } });
  }
}

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401);
  }
  return req.ctx;
}
