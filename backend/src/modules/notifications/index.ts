import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { notificationsController } from "./notifications.controller";
import { notificationIdParamsSchema } from "./notifications.validation";

const router = Router();

const mutateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyFn: (req) => `notice:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many notification updates. Try again in a few minutes.",
});

router.get("/", requireAuth, asyncHandler(notificationsController.listMine));
router.get("/unread", requireAuth, asyncHandler(notificationsController.unreadCount));
router.post("/read-all", requireAuth, mutateLimit, asyncHandler(notificationsController.markAllRead));
router.patch(
  "/:id/read",
  requireAuth,
  mutateLimit,
  validateRequest(notificationIdParamsSchema, "params"),
  asyncHandler(notificationsController.markRead),
);

export const notificationsModule: AppModule = {
  name: "notifications",
  basePath: "/notifications",
  router,
};
