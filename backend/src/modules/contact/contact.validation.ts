import { z } from "zod";
import { contactStatuses } from "./contact.types";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const createContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: optionalText(40),
  company: optionalText(120),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(120, "Subject must be 120 characters or fewer"),
  serviceSlug: optionalText(80),
  budget: optionalText(80),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(4000, "Message must be 4000 characters or fewer"),
  attachmentUrl: z
    .string()
    .trim()
    .max(500, "Attachment URL must be 500 characters or fewer")
    .optional()
    .default(""),
});

export const updateContactSchema = z.object({
  status: z.enum(contactStatuses).optional(),
  adminNote: z.string().trim().max(4000).optional(),
});

export const contactIdParamsSchema = z.object({
  id: z.uuid("Inquiry id must be a UUID"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
