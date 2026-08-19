import { z } from "zod";
import { serviceOrderStatuses } from "./service-orders.types";

const serviceSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const createServiceOrderSchema = z.object({
  serviceSlug: serviceSlugSchema,
  packageName: z.string().trim().max(80).default(""),
  requirements: z
    .string()
    .trim()
    .min(20, "Describe what you need in at least 20 characters")
    .max(8000, "Requirements must be 8000 characters or fewer"),
  budget: z.string().trim().max(80).default(""),
  timeline: z.string().trim().max(80).default(""),
});

export const grantServiceOrderSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  serviceSlug: serviceSlugSchema,
  packageName: z.string().trim().max(80).default(""),
  requirements: z.string().trim().max(8000).default("Granted from Studio"),
  budget: z.string().trim().max(80).default(""),
  timeline: z.string().trim().max(80).default(""),
});

export const updateServiceOrderSchema = z.object({
  status: z.enum(serviceOrderStatuses).optional(),
  adminNote: z.string().trim().max(4000).optional(),
});

export const serviceOrderIdParamsSchema = z.object({
  id: z.uuid("Order id must be a UUID"),
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;
export type GrantServiceOrderInput = z.infer<typeof grantServiceOrderSchema>;
export type UpdateServiceOrderInput = z.infer<typeof updateServiceOrderSchema>;
