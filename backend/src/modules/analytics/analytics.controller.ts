import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { analyticsService } from "./analytics.service";
import type { PageviewInput } from "./analytics.validation";

export const analyticsController = {
  async pageview(req: Request, res: Response) {
    await analyticsService.recordPageview(req, (req.body as PageviewInput).path);
    sendSuccess(res, null, "Recorded");
  },
};
