import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { analyticsController } from "./analytics.controller";
import { pageviewSchema } from "./analytics.validation";

const router = Router();

const pageviewLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  keyFn: (req) => `pageview:${req.ip ?? "unknown"}`,
  message: "Too many page views. Try again in a few minutes.",
});

router.post(
  "/pageview",
  pageviewLimit,
  validateRequest(pageviewSchema),
  asyncHandler(async (req, res) => analyticsController.pageview(req, res)),
);

export const analyticsModule: AppModule = {
  name: "analytics",
  basePath: "/analytics",
  router,
};
