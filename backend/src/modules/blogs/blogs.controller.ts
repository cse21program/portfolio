import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { blogsService } from "./blogs.service";
import type { UpdateBlogListInput } from "./blogs.validation";

export const blogsController = {
  async list(_req: Request, res: Response) {
    const blogs = await blogsService.list();
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, { blogs });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await blogsService.getBySlug(slug);
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const blogs = await blogsService.replaceAll(req.body as UpdateBlogListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { blogs }, "Blogs updated");
  },
};
