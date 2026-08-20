import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { videosService } from "./videos.service";
import type { CreateVideoInput, UpdateVideoInput } from "./videos.validation";

export const videosController = {
  async list(_req: Request, res: Response) {
    const { videos } = await videosService.list();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { videos });
  },

  async create(req: Request, res: Response) {
    const video = await videosService.create(req.body as CreateVideoInput);
    sendSuccess(res, { video }, "Video added", 201);
  },

  async update(req: Request, res: Response) {
    const video = await videosService.update(String(req.params.id ?? ""), req.body as UpdateVideoInput);
    sendSuccess(res, { video }, "Video updated");
  },

  async remove(req: Request, res: Response) {
    await videosService.remove(String(req.params.id ?? ""));
    sendSuccess(res, null, "Video removed");
  },
};
