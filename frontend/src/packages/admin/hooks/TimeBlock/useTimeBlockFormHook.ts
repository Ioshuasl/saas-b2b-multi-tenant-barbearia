'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { timeBlockSchema } from '@/packages/admin/schemas/TimeBlock/TimeBlockSchema';
import type { TimeBlockFormValues } from '@/packages/admin/types/TimeBlock/TimeBlockTypes';

export function useTimeBlockFormHook() {
  return useForm<TimeBlockFormValues>({
    resolver: zodResolver(timeBlockSchema),
    defaultValues: { startsAt: '', endsAt: '', reason: '', rrule: '' },
  });
}
