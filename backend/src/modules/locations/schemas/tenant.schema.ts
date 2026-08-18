import { z } from 'zod';

export const tenantUpdateSchema = z
  .object({
    name: z.string().min(2).max(80).transform((v) => v.trim()).optional(),
    slug: z
      .string()
      .min(2)
      .max(48)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido.')
      .transform((v) => v.trim().toLowerCase())
      .optional(),
    logoUrl: z.string().url().max(500).nullable().optional(),
    brandColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida.')
      .nullable()
      .optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.slug !== undefined ||
      value.logoUrl !== undefined ||
      value.brandColor !== undefined,
    { message: 'Informe ao menos um campo.' },
  );

export type TenantUpdateSchema = z.infer<typeof tenantUpdateSchema>;

export const slugQuerySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .transform((v) => v.trim().toLowerCase()),
});

export type SlugQuerySchema = z.infer<typeof slugQuerySchema>;
