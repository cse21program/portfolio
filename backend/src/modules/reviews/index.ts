import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { reviewsController } from "./reviews.controller";
import {
  createReviewSchema,
  reviewIdParamsSchema,
  updateAdminReviewSchema,
  updateReviewSchema,
} from "./reviews.validation";

const router = Router();

const mutateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `review:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many review updates. Try again in a few minutes.",
});

router.get("/", asyncHandler(reviewsController.listPublic));
router.get("/mine", requireAuth, asyncHandler(reviewsController.listMine));
router.get("/eligible", requireAuth, asyncHandler(reviewsController.listEligible));
router.get("/admin", requireAuth, requireRole("ADMIN"), asyncHandler(reviewsController.listAdmin));
router.post(
  "/",
  requireAuth,
  mutateLimit,
  validateRequest(createReviewSchema),
  asyncHandler(reviewsController.create),
);
router.patch(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(reviewIdParamsSchema, "params"),
  validateRequest(updateAdminReviewSchema),
  asyncHandler(reviewsController.updateAdmin),
);
router.patch(
  "/:id",
  requireAuth,
  mutateLimit,
  validateRequest(reviewIdParamsSchema, "params"),
  validateRequest(updateReviewSchema),
  asyncHandler(reviewsController.updateMine),
);
router.delete(
  "/:id",
  requireAuth,
  mutateLimit,
  validateRequest(reviewIdParamsSchema, "params"),
  asyncHandler(reviewsController.deleteMine),
);

export const reviewsModule: AppModule = {
  name: "reviews",
  basePath: "/reviews",
  router,
};
