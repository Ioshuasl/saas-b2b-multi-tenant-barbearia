'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { locationSchema } from '@/packages/admin/schemas/Location/LocationSchema';
import type { LocationFormValues, LocationSummary } from '@/packages/admin/types/Location/LocationTypes';

export function locationFormValues(location?: LocationSummary | null): LocationFormValues {
  return {
    name: location?.name ?? '',
    slug: location?.slug ?? '',
    timezone: location?.timezone ?? 'America/Sao_Paulo',
    phone: location?.phone ?? '',
    email: location?.email ?? '',
    city: location?.address?.city ?? '',
    state: location?.address?.state ?? '',
    street: location?.address?.street ?? '',
    active: location?.active ?? true,
    isDefault: location?.isDefault ?? false,
  };
}

export function useLocationFormHook(location?: LocationSummary | null) {
  return useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: locationFormValues(location),
  });
}
