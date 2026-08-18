import { z } from "zod";
import { isEmbedRef, isHttpsUrl, isMediaRef, uniqueStrings } from "../portfolio/portfolio.media";

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

export const topicItemSchema = z.object({
  id: uuidLike,
  skill: z
    .string()
    .trim()
    .min(2, "Skill must be at least 2 characters")
    .max(80, "Skill must be 80 characters or fewer"),
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title must be 120 characters or fewer"),
  slug: slugSchema,
  summary: z
    .string()
    .trim()
    .min(8, "Summary must be at least 8 characters")
    .max(320, "Summary must be 320 characters or fewer"),
  overview: z.string().trim().max(8000, "Overview must be 8000 characters or fewer").default(""),
  body: z.string().trim().max(20000, "Body must be 20000 characters or fewer").default(""),
  images: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Image cannot be empty")
        .refine((value) => isMediaRef(value), "Use an https URL or a site path"),
    )
    .max(24, "Use 24 topic images or fewer")
    .default([]),
  videoUrl: optionalMedia,
  embedVideoUrl: optionalMedia.refine(
    (value) => value === null || isEmbedRef(value),
    "Embed must be a YouTube or Vimeo https URL",
  ),
  codeSnippets: z.array(snippetSchema).max(12, "Use 12 code snippets or fewer").default([]),
  resources: z.array(labeledLinkSchema).max(24, "Use 24 resources or fewer").default([]),
  externalLinks: z.array(labeledLinkSchema).max(24, "Use 24 external links or fewer").default([]),
  relatedBlogSlugs: z.array(relatedSlug).max(24, "Use 24 related blogs or fewer").default([]),
  relatedTutorialSlugs: z.array(relatedSlug).max(24, "Use 24 related tutorials or fewer").default([]),
  relatedCourseSlugs: z.array(relatedSlug).max(24, "Use 24 related courses or fewer").default([]),
  relatedProjectSlugs: z.array(relatedSlug).max(24, "Use 24 related projects or fewer").default([]),
  relatedCertificateSlugs: z
    .array(relatedSlug)
    .max(24, "Use 24 related certificates or fewer")
    .default([]),
  published: z.boolean().default(true),
  seoTitle: z.string().trim().max(80, "SEO title must be 80 characters or fewer").default(""),
  seoDescription: z
    .string()
    .trim()
    .max(200, "SEO description must be 200 characters or fewer")
    .default(""),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateTopicListSchema = z
  .object({
    topics: z.array(topicItemSchema).max(200, "Use 200 topics or fewer"),
  })
  .superRefine((value, ctx) => {
    const keys = value.topics.map((item) => `${item.skill.toLowerCase()}::${item.slug}`);
    if (!uniqueStrings(keys)) {
      ctx.addIssue({
        code: "custom",
        path: ["topics"],
        message: "Each topic slug must be unique within a skill",
      });
    }
  });

export type TopicItemInput = z.infer<typeof topicItemSchema>;
export type UpdateTopicListInput = z.infer<typeof updateTopicListSchema>;
