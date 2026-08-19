import { z } from "zod";

const courseSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const enrollInputSchema = z.object({
  courseSlug: courseSlugSchema,
});

export const grantEnrollmentSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  courseSlug: courseSlugSchema,
});

export const courseSlugParamsSchema = z.object({
  courseSlug: courseSlugSchema,
});

export const enrollmentIdParamsSchema = z.object({
  id: z.uuid("Enrollment id must be a UUID"),
});

export const lessonProgressSchema = z.object({
  lessonKey: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Lesson is required")
    .max(200, "Lesson key must be 200 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/,
      "Lesson key must be module/lesson slugs",
    ),
  completed: z.boolean(),
});

export type EnrollInput = z.infer<typeof enrollInputSchema>;
export type GrantEnrollmentInput = z.infer<typeof grantEnrollmentSchema>;
export type LessonProgressInput = z.infer<typeof lessonProgressSchema>;
