import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { fieldsService } from "./fields.service";
import type { UpdateFieldListInput } from "./fields.validation";

export const fieldsController = {
  async list(_req: Request, res: Response) {
    const fields = await fieldsService.list();
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, { fields });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await fieldsService.getBySlug(slug);
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const fields = await fieldsService.replaceAll(req.body as UpdateFieldListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { fields }, "Fields updated");
  },
};
