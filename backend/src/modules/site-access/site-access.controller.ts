import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { siteAccessService } from "./site-access.service";
import type { UpdateSiteAccessInput } from "./site-access.validation";

export const siteAccessController = {
  async get(_req: Request, res: Response) {
    const catalogs = await siteAccessService.get();
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, { catalogs });
  },

  async replaceAll(req: Request, res: Response) {
    const catalogs = await siteAccessService.replaceAll(req.body as UpdateSiteAccessInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { catalogs }, "Public site updated");
  },
};
