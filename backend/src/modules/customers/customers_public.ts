import type { RequestContext } from '../../shared/domain/request_context.js';
import { CreateRepository } from './repositories/customer/customer_create.repository.js';
import { UpdateRepository } from './repositories/customer/customer_update.repository.js';
import { GetRepository } from './repositories/customer/customer_get.repository.js';
import { GetByPhoneRepository } from './repositories/customer/customer_get_by_phone.repository.js';
import { GetService } from './services/customer/customer_get.service.js';
import { UpsertByPhoneService } from './services/customer/customer_upsert_by_phone.service.js';
import type { CustomerUpsertByPhoneSchema } from './schemas/customer.schema.js';
import type { UpsertByPhoneResult } from './types/customer/customer.types.js';

const getByPhoneRepository = new GetByPhoneRepository();
const createRepository = new CreateRepository();
const getRepository = new GetRepository();
const upsertByPhoneService = new UpsertByPhoneService(
  getByPhoneRepository,
  createRepository,
  new UpdateRepository(),
);
const getService = new GetService(getRepository);

export async function getOrCreateByPhone(
  ctx: RequestContext,
  input: CustomerUpsertByPhoneSchema,
): Promise<UpsertByPhoneResult> {
  return upsertByPhoneService.execute(ctx, input);
}

export async function getSummary(
  ctx: RequestContext,
  customerId: string,
): Promise<{ name: string; phone: string } | null> {
  return getService.executeSummary(ctx, customerId);
}

export { CustomerOrigin } from './enum/customer/customer_origin.enum.js';
export { normalizePhoneE164 } from './helpers/phone_e164.js';
