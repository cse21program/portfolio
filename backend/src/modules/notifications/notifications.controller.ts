import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  async listMine(req: Request, res: Response) {
    const payload = await notificationsService.listMine(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, payload);
  },

  async unreadCount(req: Request, res: Response) {
    const payload = await notificationsService.unreadCount(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, payload);
  },

  async markRead(req: Request, res: Response) {
    const payload = await notificationsService.markRead(String(req.params.id ?? ""), req.user!.id);
    sendSuccess(res, payload, "Marked as read");
  },

  async markAllRead(req: Request, res: Response) {
    const payload = await notificationsService.markAllRead(req.user!.id);
    sendSuccess(res, payload, "All caught up");
  },
};
