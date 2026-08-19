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

export const courseStatuses = ["draft", "scheduled", "published", "archived"] as const;
export const courseDifficulties = ["Beginner", "Intermediate", "Advanced", "Professional"] as const;
export const courseLessonKinds = [
  "video",
  "text",
  "code",
  "images",
  "resources",
  "pdf",
  "quiz",
  "assignment",
] as const;

const pdfSchema = z.object({
  label: z.string().trim().min(1, "PDF label is required").max(120, "PDF label must be 120 characters or fewer"),
  url: httpsOrPath,
  fileName: z.string().trim().max(160, "File name must be 160 characters or fewer").default(""),
});

const quizQuestionSchema = z
  .object({
    prompt: z.string().trim().min(4, "Question is required").max(480, "Question must be 480 characters or fewer"),
    choices: z
      .array(z.string().trim().min(1, "Choice cannot be empty").max(240, "Choice is too long"))
      .min(2, "Use at least two choices")
      .max(6, "Use 6 choices or fewer"),
    answerIndex: z.number().int().min(0).max(5),
    explanation: z.string().trim().max(800, "Explanation must be 800 characters or fewer").default(""),
  })
  .superRefine((value, ctx) => {
    if (value.answerIndex >= value.choices.length) {
      ctx.addIssue({
        code: "custom",
        path: ["answerIndex"],
        message: "Answer must match one of the choices",
      });
    }
  });

const quizSchema = z.object({
  passingScore: z.number().int().min(1).max(100).default(70),
  questions: z.array(quizQuestionSchema).max(20, "Use 20 questions or fewer").default([]),
});

const assignmentSchema = z.object({
  brief: z
    .array(z.string().trim().min(1, "Paragraph cannot be empty").max(8000, "Paragraph is too long"))
    .max(16, "Use 16 brief paragraphs or fewer")
    .default([]),
  requirements: z
    .array(z.string().trim().min(1, "Requirement cannot be empty").max(240, "Requirement is too long"))
    .max(16, "Use 16 requirements or fewer")
    .default([]),
  submission: z.enum(["none", "link", "file", "text"]).default("none"),
  dueNote: z.string().trim().max(160, "Due note must be 160 characters or fewer").default(""),
});

const lessonSchema = z.object({
  kind: z.enum(courseLessonKinds).default("text"),
  title: z
    .string()
    .trim()
    .min(1, "Lesson title is required")
    .max(160, "Lesson title must be 160 characters or fewer"),
  summary: z.string().trim().max(400, "Lesson summary must be 400 characters or fewer").default(""),
  body: z
    .array(z.string().trim().min(1, "Paragraph cannot be empty").max(8000, "Paragraph is too long"))
    .max(40, "Use 40 paragraphs or fewer per lesson")
    .default([]),
  videoUrl: optionalMedia,
  images: z.array(httpsOrPath).max(24, "Use 24 images or fewer per lesson").default([]),
  codeSnippets: z.array(snippetSchema).max(12, "Use 12 snippets or fewer per lesson").default([]),
  resources: z.array(labeledLinkSchema).max(16, "Use 16 resources or fewer per lesson").default([]),
  downloads: z.array(labeledLinkSchema).max(16, "Use 16 downloads or fewer per lesson").default([]),
  pdfs: z.array(pdfSchema).max(8, "Use 8 PDFs or fewer per lesson").default([]),
  quiz: quizSchema.default({ passingScore: 70, questions: [] }),
  assignment: assignmentSchema.default({
    brief: [],
    requirements: [],
    submission: "none",
    dueNote: "",
  }),
});

const moduleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Module title is required")
    .max(160, "Module title must be 160 characters or fewer"),
  summary: z.string().trim().max(400, "Module summary must be 400 characters or fewer").default(""),
  lessons: z.array(lessonSchema).max(40, "Use 40 lessons or fewer per module").default([]),
});

export const courseItemSchema = z.object({
  id: uuidLike,
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title must be 160 characters or fewer"),
  slug: slugSchema,
  subtitle: z.string().trim().max(200, "Subtitle must be 200 characters or fewer").default(""),
  description: z
    .string()
    .trim()
    .min(8, "Description must be at least 8 characters")
    .max(480, "Description must be 480 characters or fewer"),
  overview: z
    .array(z.string().trim().min(1, "Paragraph cannot be empty").max(8000, "Paragraph is too long"))
    .max(24, "Use 24 overview paragraphs or fewer")
    .default([]),
  thumbnailUrl: optionalMedia,
  promoVideoUrl: optionalMedia,
  instructor: z.string().trim().max(120, "Instructor must be 120 characters or fewer").default("Rezaul Karim"),
  category: z.string().trim().max(80, "Category must be 80 characters or fewer").default(""),
  skill: z.string().trim().max(80, "Skill must be 80 characters or fewer").default(""),
  difficulty: z.enum(courseDifficulties).default("Beginner"),
  language: z.string().trim().max(40, "Language must be 40 characters or fewer").default("English"),
  duration: z.string().trim().max(40, "Duration must be 40 characters or fewer").default(""),
  requirements: z
    .array(z.string().trim().min(1, "Requirement cannot be empty").max(160, "Requirement is too long"))
    .max(16, "Use 16 requirements or fewer")
    .default([]),
  outcomes: z
    .array(z.string().trim().min(1, "Outcome cannot be empty").max(200, "Outcome is too long"))
    .max(16, "Use 16 outcomes or fewer")
    .default([]),
  audience: z
    .array(z.string().trim().min(1, "Audience cannot be empty").max(160, "Audience is too long"))
    .max(16, "Use 16 audience entries or fewer")
    .default([]),
  price: z.string().trim().max(40, "Price must be 40 characters or fewer").default("Free"),
  salePrice: z.string().trim().max(40, "Sale price must be 40 characters or fewer").default(""),
  currency: z.string().trim().max(8, "Currency must be 8 characters or fewer").default("USD"),
  free: z.boolean().default(false),
  featured: z.boolean().default(false),
  certificateAvailable: z.boolean().default(false),
  relatedSkillSlugs: z.array(relatedSlug).max(16, "Use 16 related skills or fewer").default([]),
  relatedTutorialSlugs: z.array(relatedSlug).max(16, "Use 16 related tutorials or fewer").default([]),
  relatedCourseSlugs: z.array(relatedSlug).max(16, "Use 16 related courses or fewer").default([]),
  modules: z.array(moduleSchema).max(40, "Use 40 modules or fewer").default([]),
  status: z.enum(courseStatuses).default("published"),
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

export const updateCourseListSchema = z
  .object({
    courses: z.array(courseItemSchema).max(80, "Use 80 courses or fewer"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.courses.map((item) => item.slug);
    if (!uniqueStrings(slugs)) {
      ctx.addIssue({
        code: "custom",
        path: ["courses"],
        message: "Each course slug must be unique",
      });
    }
  });

export type CourseItemInput = z.infer<typeof courseItemSchema>;
export type UpdateCourseListInput = z.infer<typeof updateCourseListSchema>;
