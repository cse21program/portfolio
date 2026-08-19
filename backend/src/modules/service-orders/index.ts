import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { serviceOrdersController } from "./service-orders.controller";
import {
  createServiceOrderSchema,
  grantServiceOrderSchema,
  serviceOrderIdParamsSchema,
  updateServiceOrderSchema,
} from "./service-orders.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const createLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `service-order:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many service requests. Try again in a few minutes.",
});

const adminLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyFn: (req) => `service-order-admin:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many order updates. Try again in a few minutes.",
});

router.get("/", requireAuth, asyncHandler(serviceOrdersController.listMine));
router.post(
  "/",
  requireAuth,
  createLimit,
  validateRequest(createServiceOrderSchema),
  asyncHandler(serviceOrdersController.create),
);

router.get("/admin", requireAuth, requireRole("ADMIN"), asyncHandler(serviceOrdersController.listAdmin));
router.post(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  adminLimit,
  validateRequest(grantServiceOrderSchema),
  asyncHandler(serviceOrdersController.grant),
);
router.patch(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminLimit,
  validateRequest(serviceOrderIdParamsSchema, "params"),
  validateRequest(updateServiceOrderSchema),
  asyncHandler(serviceOrdersController.updateAdmin),
);

router.delete(
  "/:id",
  requireAuth,
  validateRequest(serviceOrderIdParamsSchema, "params"),
  asyncHandler(serviceOrdersController.cancelMine),
);

export const serviceOrdersModule: AppModule = {
  name: "service-orders",
  basePath: "/service-orders",
  router,
};
