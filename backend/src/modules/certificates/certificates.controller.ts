import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { certificatesService } from "./certificates.service";
import type { UpdateCertificateListInput } from "./certificates.validation";

export const certificatesController = {
  async list(req: Request, res: Response) {
    const certificates = await certificatesService.list(req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, { certificates });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await certificatesService.getBySlug(slug, req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const certificates = await certificatesService.replaceAll(req.body as UpdateCertificateListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { certificates }, "Certificates updated");
  },
};
