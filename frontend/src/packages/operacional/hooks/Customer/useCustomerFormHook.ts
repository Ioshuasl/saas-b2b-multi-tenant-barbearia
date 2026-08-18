'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/packages/operacional/schemas/Customer/CustomerSchema';
import type {
  CustomerDetail,
  CustomerFormValues,
  CustomerSummary,
} from '@/packages/operacional/types/Customer/CustomerTypes';

function customerNotes(customer?: CustomerSummary | CustomerDetail | null): string {
  if (customer && 'notes' in customer) return customer.notes ?? '';
  return '';
}

export function customerFormValues(
  customer?: CustomerSummary | CustomerDetail | null,
): CustomerFormValues {
  return {
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    notes: customerNotes(customer),
    marketingOptIn: customer?.marketingOptIn ?? false,
    origin: customer?.origin,
  };
}

export function useCustomerFormHook(customer?: CustomerSummary | CustomerDetail | null) {
  return useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customerFormValues(customer),
  });
}
