import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { videosController } from "./videos.controller";
import { createVideoSchema, updateVideoSchema, videoIdParamsSchema } from "./videos.validation";

const router = Router();

const createLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyFn: (req) => `videos:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many video updates. Try again in a few minutes.",
});

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => videosController.list(req, res)),
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createLimit,
  validateRequest(createVideoSchema),
  asyncHandler(async (req, res) => videosController.create(req, res)),
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(videoIdParamsSchema, "params"),
  validateRequest(updateVideoSchema),
  asyncHandler(async (req, res) => videosController.update(req, res)),
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(videoIdParamsSchema, "params"),
  asyncHandler(async (req, res) => videosController.remove(req, res)),
);

export const videosRouter = router;
