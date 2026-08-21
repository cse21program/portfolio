import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { mailService } from "./mail.service";
import type { SetMailTransportInput, TestMailInput, UpdateMailProviderInput } from "./mail.validation";

function actor(req: Request) {
  return {
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  };
}

export const mailController = {
  async getAdmin(req: Request, res: Response) {
    const settings = await mailService.getAdmin(actor(req));
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, settings);
  },

  async updateProvider(req: Request, res: Response) {
    const provider = await mailService.updateProvider(
      String(req.params.provider ?? ""),
      req.body as UpdateMailProviderInput,
      actor(req),
    );
    sendSuccess(res, { provider }, "Mail provider saved");
  },

  async setTransport(req: Request, res: Response) {
    const settings = await mailService.setTransport(req.body as SetMailTransportInput, actor(req));
    sendSuccess(res, settings, "Mail transport saved");
  },

  async sendTest(req: Request, res: Response) {
    const result = await mailService.sendTest(req.body as TestMailInput, actor(req));
    sendSuccess(res, result, "Test email sent");
  },
};
