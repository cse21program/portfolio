import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { newsletterController } from "./newsletter.controller";
import { sendIssueSchema, subscribeSchema } from "./newsletter.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const subscribeLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: (req) => `newsletter:${req.ip ?? "unknown"}`,
  message: "Too many subscription attempts. Try again in a few minutes.",
});

const sendLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyFn: (req) => `newsletter-send:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many newsletter sends. Try again in a few minutes.",
});

router.post(
  "/",
  subscribeLimit,
  validateRequest(subscribeSchema),
  asyncHandler(newsletterController.subscribe),
);
router.get("/", requireAuth, requireRole("ADMIN"), asyncHandler(newsletterController.list));
router.post(
  "/send",
  requireAuth,
  requireRole("ADMIN"),
  sendLimit,
  validateRequest(sendIssueSchema),
  asyncHandler(newsletterController.sendIssue),
);
router.post("/unsubscribe", asyncHandler(newsletterController.unsubscribe));
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(newsletterController.remove),
);

export const newsletterModule: AppModule = {
  name: "newsletter",
  basePath: "/newsletter",
  router,
};
