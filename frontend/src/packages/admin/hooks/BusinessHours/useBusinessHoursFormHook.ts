'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { businessHoursSchema } from '@/packages/admin/schemas/BusinessHours/BusinessHoursSchema';
import { WEEKDAYS } from '@/packages/admin/enum/BusinessHours/WeekdayEnum';
import type {
  BusinessHoursFormValues,
  BusinessHoursView,
} from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export function businessHoursFormValues(view?: BusinessHoursView): BusinessHoursFormValues {
  return {
    slots: WEEKDAYS.map(({ weekday }) => {
      const slot = view?.slots.find((item) => item.weekday === weekday);
      return {
        weekday,
        enabled: Boolean(slot),
        startsAt: slot?.startsAt ?? '09:00',
        endsAt: slot?.endsAt ?? '19:00',
      };
    }),
  };
}

export function useBusinessHoursFormHook(view?: BusinessHoursView) {
  return useForm<BusinessHoursFormValues>({
    resolver: zodResolver(businessHoursSchema),
    defaultValues: businessHoursFormValues(view),
  });
}
