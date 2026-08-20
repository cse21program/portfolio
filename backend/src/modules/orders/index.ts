import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { ordersController } from "./orders.controller";
import { orderNumberParamsSchema, updateAdminOrderSchema } from "./orders.validation";

const router = Router();

const mutateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyFn: (req) => `order:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many order updates. Try again in a few minutes.",
});

router.get("/", requireAuth, asyncHandler(ordersController.listMine));
router.get("/admin", requireAuth, requireRole("ADMIN"), asyncHandler(ordersController.listAdmin));
router.patch(
  "/admin/:orderNumber",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(orderNumberParamsSchema, "params"),
  validateRequest(updateAdminOrderSchema),
  asyncHandler(ordersController.updateAdmin),
);
router.get(
  "/:orderNumber",
  requireAuth,
  validateRequest(orderNumberParamsSchema, "params"),
  asyncHandler(ordersController.getByOrderNumber),
);
router.delete(
  "/:orderNumber",
  requireAuth,
  mutateLimit,
  validateRequest(orderNumberParamsSchema, "params"),
  asyncHandler(ordersController.cancelMine),
);

export const ordersModule: AppModule = {
  name: "orders",
  basePath: "/orders",
  router,
};
