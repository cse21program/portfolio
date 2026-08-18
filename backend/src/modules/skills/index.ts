import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { skillsController } from "./skills.controller";
import { updateSkillListSchema } from "./skills.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `skills:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many skill updates. Try again in a few minutes.",
});

router.get("/", asyncHandler(skillsController.list));
router.get("/:slug", asyncHandler(skillsController.getBySlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateSkillListSchema),
  asyncHandler(skillsController.replaceAll),
);

export const skillsModule: AppModule = {
  name: "skills",
  basePath: "/skills",
  router,
};
