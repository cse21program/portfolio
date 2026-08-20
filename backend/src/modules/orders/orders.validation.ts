import { z } from "zod";
import { paymentMethods } from "./orders.types";

const phonePattern = /^[+]?[\d\s().-]{7,20}$/;

export const placeOrderSchema = z.object({
  billingName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  billingEmail: z.string().trim().toLowerCase().email("Enter a valid email address"),
  billingPhone: z
    .string()
    .trim()
    .max(40, "Phone must be 40 characters or fewer")
    .refine((value) => value.length === 0 || phonePattern.test(value), "Enter a valid phone number")
    .default(""),
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(80, "Country must be 80 characters or fewer"),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be 200 characters or fewer"),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(80, "City must be 80 characters or fewer"),
  postal: z
    .string()
    .trim()
    .min(2, "Postal code is required")
    .max(20, "Postal code must be 20 characters or fewer"),
  paymentMethod: z.enum(paymentMethods),
  termsAccepted: z
    .boolean()
    .refine((value) => value === true, "Accept the terms to place the order"),
});

export const orderNumberParamsSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^RK-\d{8}-[A-F0-9]{4}$/, "Invalid order number"),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
