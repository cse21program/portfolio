import { z } from "zod";

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  name: z
    .string()
    .trim()
    .max(80, "Name must be 80 characters or fewer")
    .optional()
    .default(""),
});

export const unsubscribeSchema = z.object({
  token: z.string().trim().min(16, "Unsubscribe token is required"),
});

export const sendIssueSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(120, "Subject must be 120 characters or fewer"),
  body: z
    .string()
    .trim()
    .min(8, "Message must be at least 8 characters")
    .max(4000, "Message must be 4000 characters or fewer"),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .default(""),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;
export type SendIssueInput = z.infer<typeof sendIssueSchema>;
