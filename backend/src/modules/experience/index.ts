import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { experienceController } from "./experience.controller";
import { updateExperienceListSchema } from "./experience.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `experience:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many experience updates. Try again in a few minutes.",
});

router.get("/", asyncHandler(experienceController.list));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateExperienceListSchema),
  asyncHandler(experienceController.replaceAll),
);

export const experienceModule: AppModule = {
  name: "experience",
  basePath: "/experience",
  router,
};
