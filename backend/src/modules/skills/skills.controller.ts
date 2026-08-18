import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { skillsService } from "./skills.service";
import type { UpdateSkillListInput } from "./skills.validation";

export const skillsController = {
  async list(_req: Request, res: Response) {
    const skills = await skillsService.list();
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, { skills });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await skillsService.getBySlug(slug);
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const skills = await skillsService.replaceAll(req.body as UpdateSkillListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { skills }, "Skills updated");
  },
};
