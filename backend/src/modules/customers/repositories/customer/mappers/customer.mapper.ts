import type { Customer as CustomerRow } from '@prisma/client';
import type { CustomerOriginName } from '../../../enum/customer/customer_origin.enum.js';
import type { CustomerDetail, CustomerSummary } from '../../../types/customer/customer.types.js';

function toIsoDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export function toCustomerSummary(row: CustomerRow): CustomerSummary {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    firstLocationId: row.firstLocationId,
    marketingOptIn: row.marketingOptIn,
    origin: row.origin as CustomerOriginName,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toCustomerDetail(row: CustomerRow, notes: string | null): CustomerDetail {
  return {
    ...toCustomerSummary(row),
    notes,
    birthdate: toIsoDate(row.birthdate),
  };
}
