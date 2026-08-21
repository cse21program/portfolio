import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { topicsService } from "./topics.service";
import type { UpdateTopicListInput } from "./topics.validation";

export const topicsController = {
  async list(req: Request, res: Response) {
    const topics = await topicsService.list(req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, { topics });
  },

  async getBySlug(req: Request, res: Response) {
    const skillSlug = String(req.params.skillSlug ?? "");
    const topicSlug = String(req.params.topicSlug ?? "");
    const payload = await topicsService.getBySlug(skillSlug, topicSlug, req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, payload);
  },

  async getByUniqueSlug(req: Request, res: Response) {
    const topicSlug = String(req.params.topicSlug ?? "");
    const payload = await topicsService.getByUniqueSlug(topicSlug, req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const topics = await topicsService.replaceAll(req.body as UpdateTopicListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { topics }, "Topics updated");
  },
};
