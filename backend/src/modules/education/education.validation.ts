import { z } from "zod";
import { isLinkHref, isMediaRef } from "../portfolio/portfolio.media";

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

export const educationItemSchema = z.object({
  id: uuidLike,
  institution: z
    .string()
    .trim()
    .min(2, "Institution must be at least 2 characters")
    .max(160, "Institution must be 160 characters or fewer"),
  degree: z
    .string()
    .trim()
    .min(1, "Degree is required")
    .max(80, "Degree must be 80 characters or fewer"),
  field: z
    .string()
    .trim()
    .min(2, "Field of study must be at least 2 characters")
    .max(160, "Field of study must be 160 characters or fewer"),
  startDate: z
    .string()
    .trim()
    .min(1, "Start date is required")
    .max(40, "Start date must be 40 characters or fewer"),
  endDate: z
    .string()
    .trim()
    .max(40, "End date must be 40 characters or fewer")
    .default(""),
  current: z.boolean().default(false),
  grade: z
    .string()
    .trim()
    .max(80, "Grade must be 80 characters or fewer")
    .default(""),
  location: z
    .string()
    .trim()
    .max(120, "Location must be 120 characters or fewer")
    .default(""),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .default(""),
  achievements: z
    .array(listItem("Achievement", 240))
    .max(24, "Use 24 achievements or fewer")
    .default([]),
  logoUrl: optionalMedia,
  documentUrl: optionalMedia,
  documentName: optionalText,
  website: optionalHref,
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateEducationListSchema = z.object({
  education: z.array(educationItemSchema).max(40, "Use 40 education records or fewer"),
});

export type EducationItemInput = z.infer<typeof educationItemSchema>;
export type UpdateEducationListInput = z.infer<typeof updateEducationListSchema>;
