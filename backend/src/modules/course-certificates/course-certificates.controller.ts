import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { courseCertificatesService } from "./course-certificates.service";

export const courseCertificatesController = {
  async getByPublicId(req: Request, res: Response) {
    const certificate = await courseCertificatesService.getByPublicId(String(req.params.publicId ?? ""));
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, { certificate });
  },
};
