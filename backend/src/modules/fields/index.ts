import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { fieldsController } from "./fields.controller";
import { updateFieldListSchema } from "./fields.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `fields:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many field updates. Try again in a few minutes.",
});

router.get("/", asyncHandler(fieldsController.list));
router.get("/:slug", asyncHandler(fieldsController.getBySlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateFieldListSchema),
  asyncHandler(fieldsController.replaceAll),
);

export const fieldsModule: AppModule = {
  name: "fields",
  basePath: "/fields",
  router,
};
