import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { educationService } from "./education.service";
import type { UpdateEducationListInput } from "./education.validation";

export const educationController = {
  async list(req: Request, res: Response) {
    const education = await educationService.list(req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, { education });
  },

  async replaceAll(req: Request, res: Response) {
    const education = await educationService.replaceAll(req.body as UpdateEducationListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { education }, "Education updated");
  },
};
