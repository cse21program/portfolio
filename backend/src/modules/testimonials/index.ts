import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { testimonialsController } from "./testimonials.controller";
import { fromReviewSchema, updateTestimonialListSchema } from "./testimonials.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `testimonials:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many testimonial updates. Try again in a few minutes.",
});

router.get("/", optionalAuth, asyncHandler(testimonialsController.list));

router.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(testimonialsController.getAdmin),
);

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateTestimonialListSchema),
  asyncHandler(testimonialsController.replaceAll),
);

router.post(
  "/from-review",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(fromReviewSchema),
  asyncHandler(testimonialsController.createFromReview),
);

export const testimonialsModule: AppModule = {
  name: "testimonials",
  basePath: "/testimonials",
  router,
};
