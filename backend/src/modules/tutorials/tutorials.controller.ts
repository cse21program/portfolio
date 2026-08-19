import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { tutorialsService } from "./tutorials.service";
import type { UpdateTutorialListInput } from "./tutorials.validation";

export const tutorialsController = {
  async list(_req: Request, res: Response) {
    const tutorials = await tutorialsService.list();
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, { tutorials });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await tutorialsService.getBySlug(slug);
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const tutorials = await tutorialsService.replaceAll(req.body as UpdateTutorialListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { tutorials }, "Tutorials updated");
  },
};
