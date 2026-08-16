import { z } from "zod";
import { isEmbedRef, isLinkHref, isMediaRef, uniqueStrings } from "./portfolio.media";

const optionalMedia = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

const mediaPath = z
  .string()
  .trim()
  .min(1, "This field is required")
  .max(500, "Must be 500 characters or fewer")
  .refine(isMediaRef, "Use an https URL or a site path such as /images/photo.jpg");

const listItem = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(max, `${label} must be ${max} characters or fewer`);

const linkHref = z
  .string()
  .trim()
  .min(1, "Link URL is required")
  .max(500, "Link URL must be 500 characters or fewer")
  .refine(isLinkHref, "Use https, a mailto link, or a site path");

export const gallerySchema = z
  .array(
    z.object({
      url: mediaPath,
      private: z.boolean(),
    }),
  )
  .max(24, "Use 24 gallery images or fewer")
  .refine((photos) => uniqueStrings(photos.map((photo) => photo.url)), "Gallery URLs must be unique");

export const updateGallerySchema = z.object({
  gallery: gallerySchema,
});

export const updateAboutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  professionalTitle: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title must be 120 characters or fewer"),
  shortBiography: z
    .string()
    .trim()
    .min(20, "Short biography must be at least 20 characters")
    .max(500, "Short biography must be 500 characters or fewer"),
  detailedBiography: z
    .array(z.string().trim().min(1, "Paragraph cannot be empty").max(4000))
    .min(1, "Add at least one biography paragraph")
    .max(12, "Use 12 paragraphs or fewer"),
  careerObjectives: z
    .string()
    .trim()
    .min(10, "Career objectives must be at least 10 characters")
    .max(2000, "Career objectives must be 2000 characters or fewer"),
  philosophy: z
    .string()
    .trim()
    .min(10, "Philosophy must be at least 10 characters")
    .max(2000, "Philosophy must be 2000 characters or fewer"),
  interests: z.array(listItem("Interest", 80)).max(20, "Use 20 interests or fewer"),
  location: z
    .string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(120, "Location must be 120 characters or fewer"),
  yearsOfExperience: z
    .string()
    .trim()
    .min(1, "Years of experience is required")
    .max(80, "Years of experience must be 80 characters or fewer"),
  languages: z
    .array(listItem("Language", 40))
    .min(1, "Add at least one language")
    .max(12, "Use 12 languages or fewer"),
  availability: z
    .string()
    .trim()
    .min(2, "Availability must be at least 2 characters")
    .max(120, "Availability must be 120 characters or fewer"),
  profilePhotoUrl: mediaPath,
  coverImageUrl: optionalMedia.refine(
    (value) => value === null || isMediaRef(value),
    "Use an https URL or a site path",
  ),
  gallery: gallerySchema,
  introVideoUrl: optionalMedia.refine(
    (value) => value === null || isMediaRef(value),
    "Use an https URL or a site path",
  ),
  embedVideoUrl: optionalMedia.refine(
    (value) => value === null || isEmbedRef(value),
    "Embed must be a YouTube or Vimeo https URL",
  ),
  links: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, "Link label is required")
          .max(40, "Link label must be 40 characters or fewer"),
        href: linkHref,
      }),
    )
    .max(20, "Use 20 links or fewer")
    .refine((links) => uniqueStrings(links.map((link) => link.href)), "Link URLs must be unique"),
});

export type UpdateAboutInput = z.infer<typeof updateAboutSchema>;
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;
