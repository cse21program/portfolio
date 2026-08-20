import { z } from "zod";

export const mediaIdParamsSchema = z.object({
  id: z.uuid("Media id must be a UUID"),
});

export const updateMediaSchema = z
  .object({
    originalName: z
      .string()
      .trim()
      .min(1, "Name the file")
      .max(180, "Name must be 180 characters or fewer")
      .optional(),
    alt: z.string().trim().max(160, "Alt text must be 160 characters or fewer").optional(),
    caption: z.string().trim().max(240, "Caption must be 240 characters or fewer").optional(),
  })
  .refine(
    (value) => value.originalName !== undefined || value.alt !== undefined || value.caption !== undefined,
    {
      message: "Change the name, alt text, or caption",
    },
  );

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
