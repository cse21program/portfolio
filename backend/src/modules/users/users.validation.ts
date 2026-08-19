import { z } from "zod";

const phonePattern = /^[+]?[\d\s().-]{7,20}$/;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  phone: z
    .string()
    .trim()
    .max(40, "Phone must be 40 characters or fewer")
    .refine((value) => value.length === 0 || phonePattern.test(value), "Enter a valid phone number")
    .default(""),
  country: z.string().trim().max(80, "Country must be 80 characters or fewer").default(""),
  notifyProduct: z.boolean().optional(),
  notifyMarketing: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
