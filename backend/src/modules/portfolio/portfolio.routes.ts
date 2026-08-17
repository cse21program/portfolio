import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { portfolioController } from "./portfolio.controller";
import { updateAboutSchema, updateGallerySchema } from "./portfolio.validation";
import { resumeController } from "./resume.controller";
import { updateResumeSchema } from "./resume.validation";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `about:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many About updates. Try again in a few minutes.",
});

router.get("/about", asyncHandler(portfolioController.getAbout));

router.get("/resume", asyncHandler(resumeController.getResume));

router.put(
  "/resume",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateResumeSchema),
  asyncHandler(resumeController.updateResume),
);

router.get(
  "/about/studio",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(portfolioController.getStudioAbout),
);

router.patch(
  "/about/gallery",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateGallerySchema),
  asyncHandler(portfolioController.updateGallery),
);

router.put(
  "/about",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateAboutSchema),
  asyncHandler(portfolioController.updateAbout),
);

export const portfolioRouter = router;
