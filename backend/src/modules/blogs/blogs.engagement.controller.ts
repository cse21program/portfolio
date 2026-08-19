import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { blogsEngagementRepository } from "./blogs.engagement.repository";
import type { CommentBodyInput } from "./blogs.engagement.validation";

export const blogsEngagementController = {
  async get(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await blogsEngagementRepository.get(slug, req.user?.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, payload);
  },

  async addComment(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const comment = await blogsEngagementRepository.addComment(
      slug,
      req.user!.id,
      req.body as CommentBodyInput,
    );
    sendSuccess(res, { comment }, "Comment posted", 201);
  },

  async deleteComment(req: Request, res: Response) {
    await blogsEngagementRepository.deleteComment(String(req.params.id ?? ""), {
      id: req.user!.id,
      role: req.user!.role,
    });
    sendSuccess(res, null, "Comment removed");
  },

  async toggleLike(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await blogsEngagementRepository.toggleLike(slug, req.user!.id);
    sendSuccess(res, payload);
  },

  async toggleBookmark(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await blogsEngagementRepository.toggleBookmark(slug, req.user!.id);
    sendSuccess(res, payload);
  },

  async listBookmarks(req: Request, res: Response) {
    const blogs = await blogsEngagementRepository.listBookmarks(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { blogs });
  },

  async listComments(_req: Request, res: Response) {
    const comments = await blogsEngagementRepository.listComments();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { comments });
  },
};
