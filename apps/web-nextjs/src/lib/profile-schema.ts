import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  shippingAddress: z.string().max(255).optional(),
  profileImageUrl: z
    .string()
    .max(500)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), {
      message: "Must be a valid URL",
    }),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export function resolveProfileImageSrc(url: string | null | undefined) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

