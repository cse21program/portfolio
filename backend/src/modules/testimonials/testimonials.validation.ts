import { z } from "zod";
import { isMediaRef } from "../portfolio/portfolio.media";

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

const optionalMedia = optionalText.refine(
  (value) => value === null || isMediaRef(value),
  "Use an https URL or a site path",
);

const uuidLike = z.uuid().optional();

export const testimonialItemSchema = z.object({
  id: uuidLike,
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be 120 characters or fewer"),
  position: z
    .string()
    .trim()
    .max(120, "Position must be 120 characters or fewer")
    .default(""),
  company: z
    .string()
    .trim()
    .max(160, "Company must be 160 characters or fewer")
    .default(""),
  imageUrl: optionalMedia,
  comment: z
    .string()
    .trim()
    .min(12, "Comment must be at least 12 characters")
    .max(1200, "Comment must be 1200 characters or fewer"),
  rating: z.number().int().min(1).max(5),
  featured: z.boolean().default(false),
  reviewId: z.uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateTestimonialListSchema = z.object({
  testimonials: z.array(testimonialItemSchema).max(60, "Use 60 testimonials or fewer"),
});

export const fromReviewSchema = z.object({
  reviewId: z.uuid(),
});

export type TestimonialItemInput = z.infer<typeof testimonialItemSchema>;
export type UpdateTestimonialListInput = z.infer<typeof updateTestimonialListSchema>;
export type FromReviewInput = z.infer<typeof fromReviewSchema>;
