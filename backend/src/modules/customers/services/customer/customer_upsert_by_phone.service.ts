import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { assertLocationAccessible } from '../../../locations/locations_public.js';
import { sealCustomerNotes } from '../../helpers/notes_crypto.js';
import { DuplicatePhoneError } from '../../models/errors/duplicate_phone.error.js';
import type { CustomerOriginName } from '../../enum/customer/customer_origin.enum.js';
import type { CustomerUpsertByPhoneSchema } from '../../schemas/customer.schema.js';
import type { UpsertByPhoneResult } from '../../types/customer/customer.types.js';
import type { CreateRepository } from '../../repositories/customer/customer_create.repository.js';
import type { GetByPhoneRepository } from '../../repositories/customer/customer_get_by_phone.repository.js';

import type { UpdateRepository } from '../../repositories/customer/customer_update.repository.js';

export class UpsertByPhoneService {
  constructor(
    private readonly getByPhoneRepository: GetByPhoneRepository,
    private readonly createRepository: CreateRepository,
    private readonly updateRepository: UpdateRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    customerSchema: CustomerUpsertByPhoneSchema,
  ): Promise<UpsertByPhoneResult> {
    await assertLocationAccessible(ctx, customerSchema.locationId);

    const existing = await this.getByPhoneRepository.execute(ctx, customerSchema.phone);
    if (existing) {
      if (customerSchema.marketingOptIn && !existing.marketingOptIn) {
        await this.updateRepository.updateMarketingOptIn(ctx, existing.id, true);
      }
      return { id: existing.id, created: false };
    }

    try {
      const created = await this.createRepository.execute(
        ctx,
        {
          firstLocationId: customerSchema.locationId,
          name: customerSchema.name,
          phone: customerSchema.phone,
          email: customerSchema.email,
          marketingOptIn: customerSchema.marketingOptIn,
          origin: customerSchema.origin as CustomerOriginName,
        },
        await sealCustomerNotes(undefined),
      );
      return { id: created.id, created: true };
    } catch (err) {
      if (err instanceof DuplicatePhoneError) {
        const raced = await this.getByPhoneRepository.execute(ctx, customerSchema.phone);
        if (raced) return { id: raced.id, created: false };
      }
      throw err;
    }
  }
}
