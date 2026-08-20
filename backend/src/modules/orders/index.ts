import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { ordersController } from "./orders.controller";
import { orderNumberParamsSchema } from "./orders.validation";

const router = Router();

router.get("/", requireAuth, asyncHandler(ordersController.listMine));
router.get("/admin", requireAuth, requireRole("ADMIN"), asyncHandler(ordersController.listAdmin));
router.get(
  "/:orderNumber",
  requireAuth,
  validateRequest(orderNumberParamsSchema, "params"),
  asyncHandler(ordersController.getByOrderNumber),
);
router.delete(
  "/:orderNumber",
  requireAuth,
  validateRequest(orderNumberParamsSchema, "params"),
  asyncHandler(ordersController.cancelMine),
);

export const ordersModule: AppModule = {
  name: "orders",
  basePath: "/orders",
  router,
};
