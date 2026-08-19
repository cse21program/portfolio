import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { blogsController } from "./blogs.controller";
import { blogsEngagementController } from "./blogs.engagement.controller";
import { commentBodySchema } from "./blogs.engagement.validation";
import { updateBlogListSchema } from "./blogs.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `blogs:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many blog updates. Try again in a few minutes.",
});

const commentLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `blog-comment:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many comments. Try again in a few minutes.",
});

router.get("/", asyncHandler(blogsController.list));
router.get("/bookmarks", requireAuth, asyncHandler(blogsEngagementController.listBookmarks));
router.get(
  "/comments",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(blogsEngagementController.listComments),
);
router.delete("/comments/:id", requireAuth, asyncHandler(blogsEngagementController.deleteComment));
router.get("/:slug/engagement", optionalAuth, asyncHandler(blogsEngagementController.get));
router.post(
  "/:slug/comments",
  requireAuth,
  commentLimit,
  validateRequest(commentBodySchema),
  asyncHandler(blogsEngagementController.addComment),
);
router.post("/:slug/like", requireAuth, asyncHandler(blogsEngagementController.toggleLike));
router.post("/:slug/bookmark", requireAuth, asyncHandler(blogsEngagementController.toggleBookmark));
router.get("/:slug", asyncHandler(blogsController.getBySlug));

router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  updateLimit,
  validateRequest(updateBlogListSchema),
  asyncHandler(blogsController.replaceAll),
);

export const blogsModule: AppModule = {
  name: "blogs",
  basePath: "/blogs",
  router,
};
