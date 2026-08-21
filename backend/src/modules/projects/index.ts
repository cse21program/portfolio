import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { projectsController } from "./projects.controller";
import { updateProjectListSchema } from "./projects.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `projects:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many project updates. Try again in a few minutes.",
});

router.get("/", optionalAuth, asyncHandler(projectsController.list));
router.get("/:slug", optionalAuth, asyncHandler(projectsController.getBySlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateProjectListSchema),
  asyncHandler(projectsController.replaceAll),
);

export const projectsModule: AppModule = {
  name: "projects",
  basePath: "/projects",
  router,
};
