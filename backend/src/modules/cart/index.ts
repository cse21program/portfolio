import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { cartController } from "./cart.controller";
import {
  addCartItemSchema,
  applyCouponSchema,
  cartItemIdParamsSchema,
  updateCartItemSchema,
} from "./cart.validation";

const router = Router();

const mutateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyFn: (req) => `cart:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many cart updates. Try again in a few minutes.",
});

router.get("/", requireAuth, asyncHandler(cartController.get));
router.delete("/", requireAuth, mutateLimit, asyncHandler(cartController.clear));
router.post(
  "/items",
  requireAuth,
  mutateLimit,
  validateRequest(addCartItemSchema),
  asyncHandler(cartController.add),
);
router.patch(
  "/items/:id",
  requireAuth,
  mutateLimit,
  validateRequest(cartItemIdParamsSchema, "params"),
  validateRequest(updateCartItemSchema),
  asyncHandler(cartController.update),
);
router.delete(
  "/items/:id",
  requireAuth,
  mutateLimit,
  validateRequest(cartItemIdParamsSchema, "params"),
  asyncHandler(cartController.remove),
);
router.post(
  "/coupon",
  requireAuth,
  mutateLimit,
  validateRequest(applyCouponSchema),
  asyncHandler(cartController.applyCoupon),
);
router.delete("/coupon", requireAuth, mutateLimit, asyncHandler(cartController.removeCoupon));

export const cartModule: AppModule = {
  name: "cart",
  basePath: "/cart",
  router,
};
