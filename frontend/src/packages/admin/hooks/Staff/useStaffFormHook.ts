'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffInviteSchema, staffSchema } from '@/packages/admin/schemas/Staff/StaffSchema';
import type { StaffFormValues, StaffSummary } from '@/packages/admin/types/Staff/StaffTypes';
import type { StaffInviteValues } from '@/packages/admin/types/Staff/StaffFormDialogTypes';

export function staffFormValues(
  staff?: StaffSummary | null,
  defaultLocationId?: string,
): StaffFormValues {
  const home = staff?.homeLocationId ?? defaultLocationId ?? '';
  return {
    name: staff?.name ?? '',
    homeLocationId: home,
    bio: staff?.bio ?? '',
    commissionPercent: staff?.commissionPercent ?? 0,
    acceptsOnlineBooking: staff?.acceptsOnlineBooking ?? true,
    active: staff?.active ?? true,
    locationIds: staff?.locationIds?.length ? staff.locationIds : home ? [home] : [],
    serviceIds: staff?.serviceIds ?? [],
  };
}

export function useStaffFormHook(staff?: StaffSummary | null, defaultLocationId?: string) {
  return useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: staffFormValues(staff, defaultLocationId),
  });
}

export function useStaffInviteFormHook() {
  return useForm<StaffInviteValues>({
    resolver: zodResolver(staffInviteSchema),
    defaultValues: { email: '' },
  });
}
