import { z } from 'zod';

export const staffCreateSchema = z.object({
  name: z.string().min(2).max(80).transform((v) => v.trim()),
  homeLocationId: z.string().uuid(),
  locationIds: z.array(z.string().uuid()).optional(),
  photoUrl: z.string().url().max(500).optional(),
  bio: z.string().max(500).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  acceptsOnlineBooking: z.boolean().optional(),
});

export type StaffCreateSchema = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = z
  .object({
    name: z.string().min(2).max(80).transform((v) => v.trim()).optional(),
    homeLocationId: z.string().uuid().optional(),
    photoUrl: z.string().url().max(500).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    commissionPercent: z.number().min(0).max(100).optional(),
    acceptsOnlineBooking: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Informe ao menos um campo.' });

export type StaffUpdateSchema = z.infer<typeof staffUpdateSchema>;

export const staffLocationsSchema = z.object({
  locationIds: z.array(z.string().uuid()).min(1),
});

export type StaffLocationsSchema = z.infer<typeof staffLocationsSchema>;

export const staffServicesSchema = z.object({
  serviceIds: z.array(z.string().uuid()),
});

export type StaffServicesSchema = z.infer<typeof staffServicesSchema>;

export const staffInviteSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
});

export type StaffInviteSchema = z.infer<typeof staffInviteSchema>;
