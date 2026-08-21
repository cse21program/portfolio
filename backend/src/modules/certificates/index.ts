import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { certificatesController } from "./certificates.controller";
import { updateCertificateListSchema } from "./certificates.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `certificates:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many certificate updates. Try again in a few minutes.",
});

router.get("/", optionalAuth, asyncHandler(certificatesController.list));
router.get("/:slug", optionalAuth, asyncHandler(certificatesController.getBySlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateCertificateListSchema),
  asyncHandler(certificatesController.replaceAll),
);

export const certificatesModule: AppModule = {
  name: "certificates",
  basePath: "/certificates",
  router,
};
