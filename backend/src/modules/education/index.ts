import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { educationController } from "./education.controller";
import { updateEducationListSchema } from "./education.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `education:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many education updates. Try again in a few minutes.",
});

router.get("/", optionalAuth, asyncHandler(educationController.list));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateEducationListSchema),
  asyncHandler(educationController.replaceAll),
);

export const educationModule: AppModule = {
  name: "education",
  basePath: "/education",
  router,
};
