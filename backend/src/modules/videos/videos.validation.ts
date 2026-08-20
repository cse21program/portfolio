import { z } from "zod";

export const videoIdParamsSchema = z.object({
  id: z.uuid("Video id must be a UUID"),
});

export const createVideoSchema = z.object({
  url: z.string().trim().url("Use a YouTube, Vimeo, or direct MP4/WebM URL"),
  title: z.string().trim().max(180, "Title must be 180 characters or fewer").optional(),
  caption: z.string().trim().max(240, "Caption must be 240 characters or fewer").optional(),
});

export const updateVideoSchema = z
  .object({
    title: z.string().trim().min(1, "Name the video").max(180, "Title must be 180 characters or fewer").optional(),
    caption: z.string().trim().max(240, "Caption must be 240 characters or fewer").optional(),
  })
  .refine((value) => value.title !== undefined || value.caption !== undefined, {
    message: "Change the title or caption",
  });

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
