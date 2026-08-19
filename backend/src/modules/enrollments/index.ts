import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { enrollmentsController } from "./enrollments.controller";
import {
  courseSlugParamsSchema,
  enrollInputSchema,
  enrollmentIdParamsSchema,
  grantEnrollmentSchema,
  lessonProgressSchema,
} from "./enrollments.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const enrollLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `enroll:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many enrollment attempts. Try again in a few minutes.",
});

const progressLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  keyFn: (req) => `enroll-progress:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many progress updates. Try again in a few minutes.",
});

const grantLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyFn: (req) => `enroll-grant:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many enrollment grants. Try again in a few minutes.",
});

router.get("/", requireAuth, asyncHandler(enrollmentsController.listMine));
router.post(
  "/",
  requireAuth,
  enrollLimit,
  validateRequest(enrollInputSchema),
  asyncHandler(enrollmentsController.enroll),
);

router.get("/admin", requireAuth, requireRole("ADMIN"), asyncHandler(enrollmentsController.listAdmin));
router.post(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  grantLimit,
  validateRequest(grantEnrollmentSchema),
  asyncHandler(enrollmentsController.grant),
);
router.delete(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(enrollmentIdParamsSchema, "params"),
  asyncHandler(enrollmentsController.revoke),
);

router.put(
  "/:courseSlug/progress",
  requireAuth,
  progressLimit,
  validateRequest(courseSlugParamsSchema, "params"),
  validateRequest(lessonProgressSchema),
  asyncHandler(enrollmentsController.setProgress),
);

router.get(
  "/:courseSlug/certificate",
  requireAuth,
  progressLimit,
  validateRequest(courseSlugParamsSchema, "params"),
  asyncHandler(enrollmentsController.claimCertificate),
);

router.delete(
  "/:courseSlug",
  requireAuth,
  validateRequest(courseSlugParamsSchema, "params"),
  asyncHandler(enrollmentsController.cancelMine),
);

export const enrollmentsModule: AppModule = {
  name: "enrollments",
  basePath: "/enrollments",
  router,
};
