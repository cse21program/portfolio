import { z } from "zod";
import { isMediaRef, uniqueStrings } from "../portfolio/portfolio.media";
import { servicePricingTypes, servicePublishStatuses } from "./services.types";

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

const faqSchema = z.object({
  question: z.string().trim().min(4, "Question must be at least 4 characters").max(200),
  answer: z.string().trim().min(8, "Answer must be at least 8 characters").max(2000),
});

const packageSchema = z.object({
  name: z.string().trim().min(2, "Package name must be at least 2 characters").max(80),
  price: z.string().trim().max(40).default(""),
  deliveryTime: z.string().trim().max(80).default(""),
  features: z.array(listItem("Package feature", 240)).max(16).default([]),
});

export const serviceItemSchema = z.object({
  id: uuidLike,
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(160),
  slug: slugSchema,
  shortDescription: z.string().trim().min(8, "Short description must be at least 8 characters").max(320),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(8000),
  thumbnailUrl: optionalMedia,
  category: z.string().trim().max(80).default(""),
  startingPrice: z.string().trim().max(80).default(""),
  pricingType: z.enum(servicePricingTypes).default("Starting from"),
  deliveryTime: z.string().trim().max(80).default(""),
  features: z.array(listItem("Feature", 240)).max(24).default([]),
  requirements: z.array(listItem("Requirement", 240)).max(16).default([]),
  technologies: z.array(listItem("Technology", 40)).max(24).default([]),
  faq: z.array(faqSchema).max(16).default([]),
  packages: z.array(packageSchema).max(6).default([]),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  status: z.enum(servicePublishStatuses).default("published"),
  publishedAt: z.string().trim().max(40).default(""),
  seoTitle: z.string().trim().max(80).default(""),
  seoDescription: z.string().trim().max(200).default(""),
  canonicalUrl: z.string().trim().max(240).default(""),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateServiceListSchema = z
  .object({
    services: z.array(serviceItemSchema).max(40, "Use 40 services or fewer"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.services.map((item) => item.slug);
    if (!uniqueStrings(slugs)) {
      ctx.addIssue({
        code: "custom",
        path: ["services"],
        message: "Each service slug must be unique",
      });
    }
  });

export type ServiceItemInput = z.infer<typeof serviceItemSchema>;
export type UpdateServiceListInput = z.infer<typeof updateServiceListSchema>;
