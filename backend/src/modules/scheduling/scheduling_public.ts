import type { RequestContext } from '../../shared/domain/request_context.js';
import { FindActiveRepository } from './repositories/appointment/appointment_find_active.repository.js';
import { ListByCustomerRepository } from './repositories/appointment/appointment_list_by_customer.repository.js';
import type { AppointmentConflictSummary } from './types/appointment/appointment_conflict.types.js';
import type { CustomerAppointmentListResult } from './types/customer_appointments.types.js';

export type ActiveAppointmentInterval = {
  startsAt: Date;
  endsAt: Date;
};

const findActive = new FindActiveRepository();
const listByCustomer = new ListByCustomerRepository();

function systemCtx(tenantId: string): RequestContext {
  return {
    tenantId,
    userId: '00000000-0000-0000-0000-000000000000',
    requestId: 'scheduling_public',
    role: 'SYSTEM',
    locationScope: 'ALL',
    locationIds: [],
  };
}

export async function findActiveByStaffAcrossLocations(input: {
  tenantId: string;
  staffId: string;
  rangeStart: Date;
  rangeEnd: Date;
}): Promise<ActiveAppointmentInterval[]> {
  return findActive.execute(systemCtx(input.tenantId), {
    staffId: input.staffId,
    rangeStart: input.rangeStart,
    rangeEnd: input.rangeEnd,
  });
}

export async function findConflictsForTimeBlock(input: {
  tenantId: string;
  locationId: string;
  staffId: string | null;
  startsAt: Date;
  endsAt: Date;
}): Promise<AppointmentConflictSummary[]> {
  return findActive.findConflicts(systemCtx(input.tenantId), input);
}

export async function listAppointmentsByCustomer(
  tenantId: string,
  customerId: string,
): Promise<CustomerAppointmentListResult> {
  return listByCustomer.execute(systemCtx(tenantId), customerId);
}
