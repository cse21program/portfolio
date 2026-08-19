import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { servicesController } from "./services.controller";
import { updateServiceListSchema } from "./services.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `services:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many service updates. Try again in a few minutes.",
});

router.get("/", optionalAuth, asyncHandler(servicesController.list));
router.get("/:slug", optionalAuth, asyncHandler(servicesController.getBySlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateServiceListSchema),
  asyncHandler(servicesController.replaceAll),
);

export const servicesModule: AppModule = {
  name: "services",
  basePath: "/services",
  router,
};
