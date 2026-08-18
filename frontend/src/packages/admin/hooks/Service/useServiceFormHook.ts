'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceSchema } from '@/packages/admin/schemas/Service/ServiceSchema';
import type { ServiceFormValues, ServiceSummary } from '@/packages/admin/types/Service/ServiceTypes';

export function serviceFormValues(service?: ServiceSummary | null): ServiceFormValues {
  return {
    name: service?.name ?? '',
    description: service?.description ?? '',
    durationMinutes: service?.durationMinutes ?? 30,
    bufferMinutes: service?.bufferMinutes ?? 0,
    priceReais: service ? service.priceCents / 100 : 0,
    visibleOnline: service?.visibleOnline ?? true,
    active: service?.active ?? true,
  };
}

export function useServiceFormHook(service?: ServiceSummary | null) {
  return useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: serviceFormValues(service),
  });
}
