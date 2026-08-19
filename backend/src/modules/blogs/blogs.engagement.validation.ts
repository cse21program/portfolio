import { z } from "zod";

export const commentBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(8, "Comment must be at least 8 characters")
    .max(2000, "Comment must be 2000 characters or fewer"),
});

export type CommentBodyInput = z.infer<typeof commentBodySchema>;
