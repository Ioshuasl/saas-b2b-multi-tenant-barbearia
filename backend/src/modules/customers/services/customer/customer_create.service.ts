import { AppError } from '../../../../shared/domain/errors.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { assertLocationAccessible } from '../../../locations/locations_public.js';
import { CustomerOrigin, type CustomerOriginName } from '../../enum/customer/customer_origin.enum.js';
import { sealCustomerNotes } from '../../helpers/notes_crypto.js';
import { DuplicatePhoneError } from '../../models/errors/duplicate_phone.error.js';
import type { CustomerCreateSchema } from '../../schemas/customer.schema.js';
import type { RequestMeta } from '../../types/request_meta.types.js';
import type { CustomerDetail } from '../../types/customer/customer.types.js';
import type { CreateRepository } from '../../repositories/customer/customer_create.repository.js';
import type { GetByPhoneRepository } from '../../repositories/customer/customer_get_by_phone.repository.js';

export class CreateService {
  constructor(
    private readonly createRepository: CreateRepository,
    private readonly getByPhoneRepository: GetByPhoneRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    customerSchema: CustomerCreateSchema,
    requestMeta: RequestMeta,
  ): Promise<CustomerDetail> {
    const firstLocationId = customerSchema.firstLocationId ?? ctx.locationId;
    if (!firstLocationId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Informe firstLocationId ou envie X-Location-Id.',
        400,
        [{ field: 'firstLocationId', issue: 'Unidade obrigatória.' }],
      );
    }

    await assertLocationAccessible(ctx, firstLocationId);

    const existing = await this.getByPhoneRepository.execute(ctx, customerSchema.phone);
    if (existing) {
      throw new DuplicatePhoneError();
    }

    const origin = (customerSchema.origin ?? CustomerOrigin.PANEL) as CustomerOriginName;
    const sealedNotes = await sealCustomerNotes(customerSchema.notes);

    const created = await this.createRepository.execute(ctx, {
      firstLocationId,
      name: customerSchema.name,
      phone: customerSchema.phone,
      email: customerSchema.email,
      notes: customerSchema.notes,
      birthdate: customerSchema.birthdate,
      marketingOptIn: customerSchema.marketingOptIn,
      origin,
    }, sealedNotes);

    await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: AuditAction.CUSTOMER_CREATED,
        resourceType: 'customer',
        resourceId: created.id,
        customerId: created.id,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
    });

    return created;
  }
}
