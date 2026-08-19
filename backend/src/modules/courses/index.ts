import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { coursesController } from "./courses.controller";
import { updateCourseListSchema } from "./courses.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `courses:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many course updates. Try again in a few minutes.",
});

router.get("/", optionalAuth, asyncHandler(coursesController.list));
router.get("/:slug", optionalAuth, asyncHandler(coursesController.getBySlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateCourseListSchema),
  asyncHandler(coursesController.replaceAll),
);

export const coursesModule: AppModule = {
  name: "courses",
  basePath: "/courses",
  router,
};
