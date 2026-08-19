import { z } from "zod";

export const publicIdParamsSchema = z.object({
  publicId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^RK-[A-F0-9]{10}$/, "Certificate id is not valid"),
});

export type PublicIdParams = z.infer<typeof publicIdParamsSchema>;
