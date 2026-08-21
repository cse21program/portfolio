import { z } from "zod";
import { mailProviderIds } from "@common/mailer/mailer.catalog";

export const mailProviderParamsSchema = z.object({
  provider: z.enum(mailProviderIds),
});

export const updateMailProviderSchema = z.object({
  credentials: z.record(z.string(), z.string()).optional(),
  activate: z.boolean().optional(),
});

export const setMailTransportSchema = z.object({
  transport: z.enum(["log", "ses", "smtp"]),
});

export const testMailSchema = z.object({
  to: z.string().trim().email().optional(),
  provider: z.enum(mailProviderIds).optional(),
});

export type UpdateMailProviderInput = z.infer<typeof updateMailProviderSchema>;
export type SetMailTransportInput = z.infer<typeof setMailTransportSchema>;
export type TestMailInput = z.infer<typeof testMailSchema>;
