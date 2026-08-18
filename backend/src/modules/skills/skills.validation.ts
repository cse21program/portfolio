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

const relatedSlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Related slug must be at least 2 characters")
  .max(80, "Related slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Related slugs must be lowercase letters, numbers, and hyphens");

const labeledLinkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: z
    .string()
    .trim()
    .min(1)
    .refine((value) => isMediaRef(value), "Use an https URL or a site path"),
});

const snippetSchema = z.object({
  label: z.string().trim().max(80).default(""),
  language: z.string().trim().min(1).max(40).default("text"),
  code: z.string().min(1).max(20000),
});

const topicItemSchema = z.object({
  id: uuidLike,
  title: z
    .string()
    .trim()
    .min(2, "Topic title must be at least 2 characters")
    .max(120, "Topic title must be 120 characters or fewer"),
  slug: slugSchema,
  summary: z
    .string()
    .trim()
    .min(8, "Topic summary must be at least 8 characters")
    .max(320, "Topic summary must be 320 characters or fewer"),
  overview: z
    .string()
    .trim()
    .max(8000, "Topic overview must be 8000 characters or fewer")
    .default(""),
  body: z.string().trim().max(20000, "Topic body must be 20000 characters or fewer").default(""),
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
  codeSnippets: z.array(snippetSchema).max(12).default([]),
  resources: z.array(labeledLinkSchema).max(24).default([]),
  externalLinks: z.array(labeledLinkSchema).max(24).default([]),
  relatedBlogSlugs: z.array(relatedSlug).max(24, "Use 24 related blogs or fewer").default([]),
  relatedTutorialSlugs: z.array(relatedSlug).max(24, "Use 24 related tutorials or fewer").default([]),
  relatedCourseSlugs: z.array(relatedSlug).max(24, "Use 24 related courses or fewer").default([]),
  relatedProjectSlugs: z.array(relatedSlug).max(24).default([]),
  relatedCertificateSlugs: z.array(relatedSlug).max(24).default([]),
  published: z.boolean().default(true),
  seoTitle: z.string().trim().max(80, "SEO title must be 80 characters or fewer").default(""),
  seoDescription: z
    .string()
    .trim()
    .max(200, "SEO description must be 200 characters or fewer")
    .default(""),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const skillItemSchema = z.object({
  id: uuidLike,
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  slug: slugSchema,
  field: z
    .string()
    .trim()
    .min(2, "Field must be at least 2 characters")
    .max(80, "Field must be 80 characters or fewer"),
  level: z
    .string()
    .trim()
    .min(1, "Level is required")
    .max(40, "Level must be 40 characters or fewer")
    .default("Intermediate"),
  years: z.string().trim().max(80, "Years must be 80 characters or fewer").default(""),
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
  imageUrl: optionalMedia,
  videoUrl: optionalMedia,
  embedVideoUrl: optionalMedia.refine(
    (value) => value === null || isEmbedRef(value),
    "Embed must be a YouTube or Vimeo https URL",
  ),
  fieldVideoUrl: optionalMedia,
  fieldEmbedVideoUrl: optionalMedia.refine(
    (value) => value === null || isEmbedRef(value),
    "Field embed must be a YouTube or Vimeo https URL",
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
  topics: z.array(topicItemSchema).max(40, "Use 40 topics or fewer").default([]),
});

export const updateSkillListSchema = z
  .object({
    skills: z.array(skillItemSchema).max(60, "Use 60 skills or fewer"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.skills.map((item) => item.slug);
    if (!uniqueStrings(slugs)) {
      ctx.addIssue({
        code: "custom",
        path: ["skills"],
        message: "Each skill slug must be unique",
      });
    }

    value.skills.forEach((skill, skillIndex) => {
      const topicSlugs = skill.topics.map((topic) => topic.slug);
      if (!uniqueStrings(topicSlugs)) {
        ctx.addIssue({
          code: "custom",
          path: ["skills", skillIndex, "topics"],
          message: "Each topic slug must be unique within a skill",
        });
      }
    });
  });

export type TopicItemInput = z.infer<typeof topicItemSchema>;
export type SkillItemInput = z.infer<typeof skillItemSchema>;
export type UpdateSkillListInput = z.infer<typeof updateSkillListSchema>;
