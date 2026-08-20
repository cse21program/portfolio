import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { placeOrderSchema } from "@modules/orders/orders.validation";
import { checkoutController } from "./checkout.controller";

const router = Router();

const placeLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `checkout:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many checkout attempts. Try again in a few minutes.",
});

router.post(
  "/",
  requireAuth,
  placeLimit,
  validateRequest(placeOrderSchema),
  asyncHandler(checkoutController.place),
);

export const checkoutModule: AppModule = {
  name: "checkout",
  basePath: "/checkout",
  router,
};
