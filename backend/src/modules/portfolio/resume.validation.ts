import { z } from "zod";
import { isLinkHref, isMediaRef } from "./portfolio.media";

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

const optionalHref = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  .refine((value) => value === null || isLinkHref(value), "Use https, a mailto link, or a site path");

const creditSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title must be 160 characters or fewer"),
  detail: z
    .string()
    .trim()
    .max(200, "Detail must be 200 characters or fewer")
    .default(""),
  year: z
    .string()
    .trim()
    .max(40, "Year must be 40 characters or fewer")
    .default(""),
  href: optionalHref,
});

const optionalPdf = optionalText.refine(
  (value) => value === null || isMediaRef(value),
  "Use an https URL or a site path for the PDF",
);

export const updateResumeSchema = z.object({
  headline: optionalText.pipe(
    z
      .string()
      .max(120, "Headline must be 120 characters or fewer")
      .nullable(),
  ),
  summary: optionalText.pipe(
    z
      .string()
      .max(1200, "Summary must be 1200 characters or fewer")
      .nullable(),
  ),
  awards: z.array(creditSchema).max(24, "Use 24 awards or fewer"),
  publications: z.array(creditSchema).max(24, "Use 24 publications or fewer"),
  pdfUrl: optionalPdf,
  pdfFileName: optionalText.pipe(
    z
      .string()
      .max(180, "File name must be 180 characters or fewer")
      .nullable(),
  ),
});

export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
