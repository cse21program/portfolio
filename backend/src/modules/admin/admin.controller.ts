import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { adminService } from "./admin.service";

export const adminController = {
  async dashboard(_req: Request, res: Response) {
    const dashboard = await adminService.dashboard();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { dashboard });
  },
};
