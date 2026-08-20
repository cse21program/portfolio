import { z } from "zod";
import { paymentProviders } from "./gateways/gateway";
import { paymentProviderModes } from "./providers/catalog";

export const startPaymentSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^RK-\d{8}-[A-F0-9]{4}$/, "Invalid order number"),
  provider: z.enum(paymentProviders).optional(),
});

export const demoPaymentSchema = z.object({
  action: z.enum(["succeed", "fail", "cancel"]),
});

export const reportPaymentSchema = z.object({
  reference: z.string().trim().max(80).optional(),
});

export const paymentIdParamsSchema = z.object({
  id: z.uuid("Payment id must be a UUID"),
});

export const paymentProviderParamsSchema = z.object({
  provider: z.enum(paymentProviders),
});

export const updateProviderSettingSchema = z.object({
  enabled: z.boolean().optional(),
  mode: z.enum(paymentProviderModes).optional(),
  credentials: z.record(z.string(), z.string()).optional(),
});

export type StartPaymentInput = z.infer<typeof startPaymentSchema>;
export type DemoPaymentInput = z.infer<typeof demoPaymentSchema>;
export type ReportPaymentInput = z.infer<typeof reportPaymentSchema>;
export type UpdateProviderSettingInput = z.infer<typeof updateProviderSettingSchema>;
