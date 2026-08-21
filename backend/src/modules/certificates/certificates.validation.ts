import { z } from "zod";
import { contentStatuses } from "@common/publishing";
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

const uuidLike = z.uuid().optional();

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const certificateItemSchema = z.object({
  id: uuidLike,
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title must be 160 characters or fewer"),
  slug: slugSchema,
  organization: z
    .string()
    .trim()
    .min(2, "Organization must be at least 2 characters")
    .max(160, "Organization must be 160 characters or fewer"),
  issueDate: z.string().trim().max(40, "Issue date must be 40 characters or fewer").default(""),
  expiryDate: z.string().trim().max(40, "Expiry date must be 40 characters or fewer").default(""),
  credentialId: z
    .string()
    .trim()
    .max(120, "Credential ID must be 120 characters or fewer")
    .default(""),
  skill: z.string().trim().max(80, "Skill must be 80 characters or fewer").default(""),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .default(""),
  imageUrl: optionalMedia,
  documentUrl: optionalMedia,
  documentName: optionalText,
  verificationUrl: optionalHref,
  featured: z.boolean().default(false),
  status: z.enum(contentStatuses).default("published"),
  publishedAt: z.string().trim().max(40, "Published date must be 40 characters or fewer").default(""),
  seoTitle: z.string().trim().max(80, "SEO title must be 80 characters or fewer").default(""),
  seoDescription: z
    .string()
    .trim()
    .max(200, "SEO description must be 200 characters or fewer")
    .default(""),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateCertificateListSchema = z
  .object({
    certificates: z.array(certificateItemSchema).max(80, "Use 80 certificates or fewer"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.certificates.map((item) => item.slug);
    if (!uniqueStrings(slugs)) {
      ctx.addIssue({
        code: "custom",
        path: ["certificates"],
        message: "Each certificate slug must be unique",
      });
    }
  });

export type CertificateItemInput = z.infer<typeof certificateItemSchema>;
export type UpdateCertificateListInput = z.infer<typeof updateCertificateListSchema>;
