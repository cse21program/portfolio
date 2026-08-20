import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { tutorialsService } from "./tutorials.service";
import type { UpdateTutorialListInput } from "./tutorials.validation";

export const tutorialsController = {
  async list(req: Request, res: Response) {
    const tutorials = await tutorialsService.list(req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, { tutorials });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await tutorialsService.getBySlug(slug, req.user);
    res.setHeader("Cache-Control", "private, no-store");
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
