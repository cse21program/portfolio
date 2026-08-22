import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { followsController } from "./follows.controller";
import { followAdminUserParamsSchema } from "./follows.validation";

const router = Router();

const mutateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyFn: (req) => `follow:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many follow updates. Try again in a few minutes.",
});

router.get("/studio", optionalAuth, asyncHandler(followsController.getStudio));
router.post("/studio", requireAuth, mutateLimit, asyncHandler(followsController.followStudio));
router.delete("/studio", requireAuth, mutateLimit, asyncHandler(followsController.unfollowStudio));
router.get(
  "/admin/studio",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(followsController.listStudioAdmin),
);
router.delete(
  "/admin/studio/:userId",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(followAdminUserParamsSchema, "params"),
  asyncHandler(followsController.removeStudioFollower),
);

export const followsModule: AppModule = {
  name: "follows",
  basePath: "/follows",
  router,
};
