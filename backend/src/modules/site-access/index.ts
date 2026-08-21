import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { siteAccessController } from "./site-access.controller";
import { updateSiteAccessSchema } from "./site-access.validation";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `site-access:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many public site updates. Try again in a few minutes.",
});

router.get("/", asyncHandler(siteAccessController.get));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateSiteAccessSchema),
  asyncHandler(siteAccessController.replaceAll),
);

export const siteAccessModule: AppModule = {
  name: "site-access",
  basePath: "/site-access",
  router,
};
