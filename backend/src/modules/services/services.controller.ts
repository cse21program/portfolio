import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { servicesService } from "./services.service";
import type { UpdateServiceListInput } from "./services.validation";

export const servicesController = {
  async list(req: Request, res: Response) {
    const services = await servicesService.list(req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, { services });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await servicesService.getBySlug(slug, req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const services = await servicesService.replaceAll(req.body as UpdateServiceListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { services }, "Services updated");
  },
};
