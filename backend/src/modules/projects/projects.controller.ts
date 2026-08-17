import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { projectsService } from "./projects.service";
import type { UpdateProjectListInput } from "./projects.validation";

export const projectsController = {
  async list(_req: Request, res: Response) {
    const projects = await projectsService.list();
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, { projects });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await projectsService.getBySlug(slug);
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const projects = await projectsService.replaceAll(req.body as UpdateProjectListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { projects }, "Projects updated");
  },
};
