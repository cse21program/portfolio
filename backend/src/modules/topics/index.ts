import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { topicsController } from "./topics.controller";
import { updateTopicListSchema } from "./topics.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `topics:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many topic updates. Try again in a few minutes.",
});

router.get("/", asyncHandler(topicsController.list));
router.get("/:skillSlug/:topicSlug", asyncHandler(topicsController.getBySlug));
router.get("/:topicSlug", asyncHandler(topicsController.getByUniqueSlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateTopicListSchema),
  asyncHandler(topicsController.replaceAll),
);

export const topicsModule: AppModule = {
  name: "topics",
  basePath: "/topics",
  router,
};
