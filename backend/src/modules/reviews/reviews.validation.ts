import { z } from "zod";
import { reviewKinds, reviewStatuses } from "./reviews.types";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const createReviewSchema = z.object({
  kind: z.enum(reviewKinds),
  slug: slugSchema,
  rating: z.coerce.number().int().min(1, "Choose a rating from 1 to 5").max(5, "Choose a rating from 1 to 5"),
  comment: z
    .string()
    .trim()
    .min(20, "Say a little more — at least 20 characters")
    .max(2000, "Comment must be 2000 characters or fewer"),
});

export const updateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z.string().trim().min(20).max(2000).optional(),
  })
  .refine((value) => value.rating !== undefined || value.comment !== undefined, {
    message: "Change the rating or the comment",
  });

export const updateAdminReviewSchema = z
  .object({
    status: z.enum(reviewStatuses).optional(),
    adminNote: z.string().trim().max(500, "Note must be 500 characters or fewer").optional(),
  })
  .refine((value) => value.status !== undefined || value.adminNote !== undefined, {
    message: "Approve, reject, or add a note",
  });

export const reviewIdParamsSchema = z.object({
  id: z.uuid("Review id must be a UUID"),
});

export const listPublicReviewsSchema = z.object({
  kind: z.enum(reviewKinds),
  slug: slugSchema,
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type UpdateAdminReviewInput = z.infer<typeof updateAdminReviewSchema>;
export type ListPublicReviewsInput = z.infer<typeof listPublicReviewsSchema>;
