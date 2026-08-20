import { z } from "zod";
import { cartItemKinds } from "./cart.types";

export const addCartItemSchema = z.object({
  kind: z.enum(cartItemKinds),
  slug: z
    .string()
    .trim()
    .min(2, "Choose a catalog item")
    .max(80, "Slug must be 80 characters or fewer"),
  packageName: z.string().trim().max(80, "Package name must be 80 characters or fewer").default(""),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(5, "Quantity must be 5 or fewer"),
});

export const cartItemIdParamsSchema = z.object({
  id: z.string().uuid("Item not found"),
});

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Enter a coupon code")
    .max(40, "Coupon code must be 40 characters or fewer"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
