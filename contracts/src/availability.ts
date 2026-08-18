import { z } from 'zod';

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  staffId: string;
  staffName: string;
};

export type AvailabilityResult = {
  slots: AvailabilitySlot[];
  timezone: string;
};

export type AvailabilityListQuery = {
  locationId: string;
  serviceIds: string[];
  staffId?: string;
  from: string;
  to: string;
};

export const availabilityListQuerySchema = z.object({
  locationId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  staffId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
