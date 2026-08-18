'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { publicAppointmentBookSchema } from '@/packages/public/schemas/PublicAppointment/PublicAppointmentSchema';
import type { PublicAppointmentFormValues } from '@/packages/public/types/PublicAppointment/PublicAppointmentTypes';

export function usePublicAppointmentFormHook() {
  return useForm<PublicAppointmentFormValues>({
    resolver: zodResolver(publicAppointmentBookSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      consentDataProcessing: false,
      consentWhatsappMarketing: false,
      website: '',
      captchaToken: '',
    },
  });
}
