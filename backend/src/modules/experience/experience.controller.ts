import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { experienceService } from "./experience.service";
import type { UpdateExperienceListInput } from "./experience.validation";

export const experienceController = {
  async list(req: Request, res: Response) {
    const experiences = await experienceService.list(req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, { experiences });
  },

  async replaceAll(req: Request, res: Response) {
    const experiences = await experienceService.replaceAll(req.body as UpdateExperienceListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { experiences }, "Experience updated");
  },
};
