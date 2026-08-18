import { z } from "zod";
import { isEmbedRef, isMediaRef, uniqueStrings } from "../portfolio/portfolio.media";

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

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const fieldItemSchema = z.object({
  id: uuidLike,
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  slug: slugSchema,
  summary: z
    .string()
    .trim()
    .min(8, "Summary must be at least 8 characters")
    .max(320, "Summary must be 320 characters or fewer"),
  overview: z
    .string()
    .trim()
    .max(8000, "Overview must be 8000 characters or fewer")
    .default(""),
  iconUrl: optionalMedia,
  thumbnailUrl: optionalMedia,
  bannerUrl: optionalMedia,
  videoUrl: optionalMedia,
  embedVideoUrl: optionalMedia.refine(
    (value) => value === null || isEmbedRef(value),
    "Embed must be a YouTube or Vimeo https URL",
  ),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  seoTitle: z.string().trim().max(80, "SEO title must be 80 characters or fewer").default(""),
  seoDescription: z
    .string()
    .trim()
    .max(200, "SEO description must be 200 characters or fewer")
    .default(""),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateFieldListSchema = z
  .object({
    fields: z.array(fieldItemSchema).max(40, "Use 40 fields or fewer"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.fields.map((item) => item.slug);
    if (!uniqueStrings(slugs)) {
      ctx.addIssue({
        code: "custom",
        path: ["fields"],
        message: "Each field slug must be unique",
      });
    }
  });

export type FieldItemInput = z.infer<typeof fieldItemSchema>;
export type UpdateFieldListInput = z.infer<typeof updateFieldListSchema>;
