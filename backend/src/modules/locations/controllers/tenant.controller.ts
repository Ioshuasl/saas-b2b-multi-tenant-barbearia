import type { Request, Response } from 'express';
import { parseBody, parseQuery } from '../helpers/http_parse.js';
import { requireCtx } from '../helpers/require_ctx.js';
import { slugQuerySchema, tenantUpdateSchema } from '../schemas/tenant.schema.js';
import { onboardingUpdateSchema } from '../schemas/onboarding.schema.js';
import type { GetService as TenantGetService } from '../services/tenant/tenant_get.service.js';
import type { UpdateService as TenantUpdateService } from '../services/tenant/tenant_update.service.js';
import type { SlugAvailableService } from '../services/tenant/tenant_slug_available.service.js';
import type { GetService as OnboardingGetService } from '../services/onboarding/onboarding_get.service.js';
import type { UpdateService as OnboardingUpdateService } from '../services/onboarding/onboarding_update.service.js';

export class TenantController {
  constructor(
    private readonly getService: TenantGetService,
    private readonly updateService: TenantUpdateService,
    private readonly slugAvailableService: SlugAvailableService,
    private readonly onboardingGetService: OnboardingGetService,
    private readonly onboardingUpdateService: OnboardingUpdateService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const tenant = await this.getService.execute(requireCtx(req));
    res.status(200).json({ data: tenant });
  }

  async update(req: Request, res: Response): Promise<void> {
    const tenantSchema = parseBody(tenantUpdateSchema, req.body);
    const tenant = await this.updateService.execute(requireCtx(req), tenantSchema);
    res.status(200).json({ data: tenant });
  }

  async slugAvailable(req: Request, res: Response): Promise<void> {
    const slugQuery = parseQuery(slugQuerySchema, req.query);
    const result = await this.slugAvailableService.execute(requireCtx(req), slugQuery.slug);
    res.status(200).json({ data: result });
  }

  async getOnboarding(req: Request, res: Response): Promise<void> {
    const onboarding = await this.onboardingGetService.execute(requireCtx(req));
    res.status(200).json({ data: onboarding });
  }

  async updateOnboarding(req: Request, res: Response): Promise<void> {
    const onboardingSchema = parseBody(onboardingUpdateSchema, req.body);
    const onboarding = await this.onboardingUpdateService.execute(
      requireCtx(req),
      onboardingSchema,
    );
    res.status(200).json({ data: onboarding });
  }
}
