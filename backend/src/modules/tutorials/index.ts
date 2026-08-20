import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { tutorialsController } from "./tutorials.controller";
import { updateTutorialListSchema } from "./tutorials.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `tutorials:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many tutorial updates. Try again in a few minutes.",
});

router.get("/", optionalAuth, asyncHandler(tutorialsController.list));
router.get("/:slug", optionalAuth, asyncHandler(tutorialsController.getBySlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateTutorialListSchema),
  asyncHandler(tutorialsController.replaceAll),
);

export const tutorialsModule: AppModule = {
  name: "tutorials",
  basePath: "/tutorials",
  router,
};
