import { z } from "zod";
import { isEmbedRef, isHttpsUrl, isLinkHref, isMediaRef, uniqueStrings } from "../portfolio/portfolio.media";

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
  (value) => value === null || isMediaRef(value) || isEmbedRef(value),
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

const relatedSlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Related slug must be at least 2 characters")
  .max(80, "Related slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Related slugs must be lowercase letters, numbers, and hyphens");

const httpsOrPath = z
  .string()
  .trim()
  .min(1, "URL cannot be empty")
  .refine((value) => isHttpsUrl(value) || isMediaRef(value), "Use an https URL or a site path");

const labeledLinkSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(120, "Label must be 120 characters or fewer"),
  url: httpsOrPath,
});

const snippetSchema = z.object({
  label: z.string().trim().max(80, "Snippet label must be 80 characters or fewer").default(""),
  language: z
    .string()
    .trim()
    .min(1, "Language is required")
    .max(40, "Language must be 40 characters or fewer")
    .default("text"),
  code: z.string().min(1, "Code cannot be empty").max(20000, "Code must be 20000 characters or fewer"),
});

export const tutorialStatuses = ["draft", "scheduled", "published", "archived"] as const;
export const tutorialDifficulties = ["Beginner", "Intermediate", "Advanced", "Professional"] as const;

const sectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Section title is required")
    .max(160, "Section title must be 160 characters or fewer"),
  summary: z.string().trim().max(400, "Section summary must be 400 characters or fewer").default(""),
  body: z
    .array(z.string().trim().min(1, "Paragraph cannot be empty").max(8000, "Paragraph is too long"))
    .max(40, "Use 40 paragraphs or fewer per section")
    .default([]),
  videoUrl: optionalMedia,
  images: z.array(httpsOrPath).max(24, "Use 24 images or fewer per section").default([]),
  codeSnippets: z.array(snippetSchema).max(12, "Use 12 snippets or fewer per section").default([]),
  resources: z.array(labeledLinkSchema).max(16, "Use 16 resources or fewer per section").default([]),
  downloads: z.array(labeledLinkSchema).max(16, "Use 16 downloads or fewer per section").default([]),
});

export const tutorialItemSchema = z.object({
  id: uuidLike,
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title must be 160 characters or fewer"),
  slug: slugSchema,
  description: z
    .string()
    .trim()
    .min(8, "Description must be at least 8 characters")
    .max(480, "Description must be 480 characters or fewer"),
  difficulty: z.enum(tutorialDifficulties).default("Beginner"),
  prerequisites: z
    .array(z.string().trim().min(1, "Prerequisite cannot be empty").max(160, "Prerequisite is too long"))
    .max(16, "Use 16 prerequisites or fewer")
    .default([]),
  duration: z.string().trim().max(40, "Duration must be 40 characters or fewer").default(""),
  thumbnailUrl: optionalMedia,
  skill: z.string().trim().max(80, "Skill must be 80 characters or fewer").default(""),
  relatedSkillSlugs: z.array(relatedSlug).max(16, "Use 16 related skills or fewer").default([]),
  relatedCourseSlugs: z.array(relatedSlug).max(16, "Use 16 related courses or fewer").default([]),
  price: z.string().trim().max(40, "Price must be 40 characters or fewer").default("Free"),
  free: z.boolean().default(true),
  sections: z.array(sectionSchema).max(40, "Use 40 sections or fewer").default([]),
  status: z.enum(tutorialStatuses).default("published"),
  publishedAt: z.string().trim().max(40, "Published date must be 40 characters or fewer").default(""),
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

export const updateTutorialListSchema = z
  .object({
    tutorials: z.array(tutorialItemSchema).max(80, "Use 80 tutorials or fewer"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.tutorials.map((item) => item.slug);
    if (!uniqueStrings(slugs)) {
      ctx.addIssue({
        code: "custom",
        path: ["tutorials"],
        message: "Each tutorial slug must be unique",
      });
    }
  });

export type TutorialItemInput = z.infer<typeof tutorialItemSchema>;
export type UpdateTutorialListInput = z.infer<typeof updateTutorialListSchema>;
