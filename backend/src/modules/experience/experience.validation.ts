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

const optionalLogo = optionalText.refine(
  (value) => value === null || isMediaRef(value),
  "Use an https URL or a site path for the logo",
);

const listItem = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(max, `${label} must be ${max} characters or fewer`);

const uuidLike = z.uuid().optional();

export const experienceItemSchema = z.object({
  id: uuidLike,
  company: z
    .string()
    .trim()
    .min(2, "Company must be at least 2 characters")
    .max(120, "Company must be 120 characters or fewer"),
  position: z
    .string()
    .trim()
    .min(2, "Position must be at least 2 characters")
    .max(120, "Position must be 120 characters or fewer"),
  type: z
    .string()
    .trim()
    .min(1, "Employment type is required")
    .max(40, "Employment type must be 40 characters or fewer"),
  location: z
    .string()
    .trim()
    .max(120, "Location must be 120 characters or fewer")
    .default(""),
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
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .default(""),
  responsibilities: z
    .array(listItem("Responsibility", 240))
    .max(24, "Use 24 responsibilities or fewer")
    .default([]),
  achievements: z
    .array(listItem("Achievement", 240))
    .max(24, "Use 24 achievements or fewer")
    .default([]),
  technologies: z
    .array(listItem("Technology", 60))
    .max(24, "Use 24 technologies or fewer")
    .default([]),
  logoUrl: optionalLogo,
  website: optionalHref,
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateExperienceListSchema = z.object({
  experiences: z
    .array(experienceItemSchema)
    .max(40, "Use 40 experience records or fewer"),
});

export type ExperienceItemInput = z.infer<typeof experienceItemSchema>;
export type UpdateExperienceListInput = z.infer<typeof updateExperienceListSchema>;
