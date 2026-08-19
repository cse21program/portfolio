import { z } from "zod";
import { isLinkHref, isMediaRef, uniqueStrings } from "../portfolio/portfolio.media";

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

const tagSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(40, "Tag must be 40 characters or fewer");

export const blogStatuses = ["draft", "scheduled", "published", "archived"] as const;

export const blogItemSchema = z.object({
  id: uuidLike,
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title must be 160 characters or fewer"),
  slug: slugSchema,
  excerpt: z
    .string()
    .trim()
    .min(8, "Excerpt must be at least 8 characters")
    .max(320, "Excerpt must be 320 characters or fewer"),
  content: z
    .array(z.string().trim().min(1, "Paragraph cannot be empty").max(8000, "Paragraph is too long"))
    .max(80, "Use 80 paragraphs or fewer")
    .default([]),
  featuredImageUrl: optionalMedia,
  author: z.string().trim().max(80, "Author must be 80 characters or fewer").default(""),
  category: z.string().trim().max(80, "Category must be 80 characters or fewer").default(""),
  tags: z.array(tagSchema).max(16, "Use 16 tags or fewer").default([]),
  skill: z.string().trim().max(80, "Skill must be 80 characters or fewer").default(""),
  topic: z.string().trim().max(80, "Topic must be 80 characters or fewer").default(""),
  readingTime: z.string().trim().max(40, "Reading time must be 40 characters or fewer").default(""),
  publishedAt: z.string().trim().max(40, "Published date must be 40 characters or fewer").default(""),
  status: z.enum(blogStatuses).default("published"),
  seoTitle: z.string().trim().max(80, "SEO title must be 80 characters or fewer").default(""),
  seoDescription: z
    .string()
    .trim()
    .max(200, "SEO description must be 200 characters or fewer")
    .default(""),
  canonicalUrl: z
    .string()
    .trim()
    .max(240, "Canonical URL must be 240 characters or fewer")
    .default("")
    .refine((value) => value.length === 0 || isLinkHref(value), "Canonical URL must be https or a site path"),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateBlogListSchema = z
  .object({
    blogs: z.array(blogItemSchema).max(80, "Use 80 posts or fewer"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.blogs.map((item) => item.slug);
    if (!uniqueStrings(slugs)) {
      ctx.addIssue({
        code: "custom",
        path: ["blogs"],
        message: "Each blog slug must be unique",
      });
    }
  });

export type BlogItemInput = z.infer<typeof blogItemSchema>;
export type UpdateBlogListInput = z.infer<typeof updateBlogListSchema>;
