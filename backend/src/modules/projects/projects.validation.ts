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

const optionalHref = optionalText.refine(
  (value) => value === null || isLinkHref(value),
  "Use https, a mailto link, or a site path",
);

const optionalMedia = optionalText.refine(
  (value) => value === null || isMediaRef(value),
  "Use an https URL or a site path",
);

const listItem = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(max, `${label} must be ${max} characters or fewer`);

const uuidLike = z.uuid().optional();

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const projectItemSchema = z.object({
  id: uuidLike,
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title must be 160 characters or fewer"),
  slug: slugSchema,
  shortDescription: z
    .string()
    .trim()
    .min(8, "Short description must be at least 8 characters")
    .max(320, "Short description must be 320 characters or fewer"),
  fullDescription: z
    .string()
    .trim()
    .max(8000, "Full description must be 8000 characters or fewer")
    .default(""),
  thumbnailUrl: optionalMedia,
  images: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Image cannot be empty")
        .refine((value) => isMediaRef(value), "Use an https URL or a site path"),
    )
    .max(24, "Use 24 images or fewer")
    .default([]),
  demoVideoUrl: optionalMedia,
  category: z
    .string()
    .trim()
    .max(80, "Category must be 80 characters or fewer")
    .default(""),
  technologies: z
    .array(listItem("Technology", 40))
    .max(24, "Use 24 technologies or fewer")
    .default([]),
  features: z.array(listItem("Feature", 240)).max(24, "Use 24 features or fewer").default([]),
  architecture: z
    .string()
    .trim()
    .max(4000, "Architecture must be 4000 characters or fewer")
    .default(""),
  problem: z.string().trim().max(4000, "Problem must be 4000 characters or fewer").default(""),
  requirements: z
    .string()
    .trim()
    .max(4000, "Requirements must be 4000 characters or fewer")
    .default(""),
  solution: z.string().trim().max(4000, "Solution must be 4000 characters or fewer").default(""),
  challenges: z.array(listItem("Challenge", 400)).max(24, "Use 24 challenges or fewer").default([]),
  solutions: z.array(listItem("Solution", 400)).max(24, "Use 24 solutions or fewer").default([]),
  lessons: z.array(listItem("Lesson", 400)).max(24, "Use 24 lessons or fewer").default([]),
  status: z
    .string()
    .trim()
    .min(1, "Status is required")
    .max(40, "Status must be 40 characters or fewer")
    .default("Shipped"),
  startDate: z.string().trim().max(40, "Start date must be 40 characters or fewer").default(""),
  endDate: z.string().trim().max(40, "End date must be 40 characters or fewer").default(""),
  githubUrl: optionalHref,
  liveUrl: optionalHref,
  docsUrl: optionalHref,
  featured: z.boolean().default(false),
  seoTitle: z.string().trim().max(80, "SEO title must be 80 characters or fewer").default(""),
  seoDescription: z
    .string()
    .trim()
    .max(200, "SEO description must be 200 characters or fewer")
    .default(""),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateProjectListSchema = z
  .object({
    projects: z.array(projectItemSchema).max(40, "Use 40 projects or fewer"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.projects.map((item) => item.slug);
    if (!uniqueStrings(slugs)) {
      ctx.addIssue({
        code: "custom",
        path: ["projects"],
        message: "Each project slug must be unique",
      });
    }
  });

export type ProjectItemInput = z.infer<typeof projectItemSchema>;
export type UpdateProjectListInput = z.infer<typeof updateProjectListSchema>;
