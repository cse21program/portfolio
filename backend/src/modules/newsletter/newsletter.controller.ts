import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { newsletterService } from "./newsletter.service";
import type { SendIssueInput, SubscribeInput, UnsubscribeInput } from "./newsletter.validation";

function unsubscribeToken(req: Request) {
  const body = req.body as UnsubscribeInput | { "List-Unsubscribe"?: string } | undefined;
  if (body && "token" in body && typeof body.token === "string") {
    return body.token;
  }
  return String(req.query.token ?? "");
}

export const newsletterController = {
  async subscribe(req: Request, res: Response) {
    const subscriber = await newsletterService.subscribe(req.body as SubscribeInput);
    sendSuccess(res, { subscriber }, "You're on the list");
  },

  async list(_req: Request, res: Response) {
    const subscribers = await newsletterService.list();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { subscribers });
  },

  async remove(req: Request, res: Response) {
    await newsletterService.remove(String(req.params.id ?? ""));
    sendSuccess(res, null, "Subscriber removed");
  },

  async unsubscribe(req: Request, res: Response) {
    await newsletterService.unsubscribe(unsubscribeToken(req));
    sendSuccess(res, null, "Unsubscribed");
  },

  async sendIssue(req: Request, res: Response) {
    const result = await newsletterService.sendIssue(req.body as SendIssueInput);
    sendSuccess(res, result, "Issue sent");
  },
};
