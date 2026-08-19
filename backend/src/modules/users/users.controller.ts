import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { usersService } from "./users.service";
import type { UpdateProfileInput } from "./users.validation";

export const usersController = {
  async me(req: Request, res: Response) {
    const user = await usersService.me(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { user });
  },

  async update(req: Request, res: Response) {
    const user = await usersService.update(req.user!.id, req.body as UpdateProfileInput);
    sendSuccess(res, { user }, "Profile updated");
  },

  async updateAvatar(req: Request, res: Response) {
    const user = await usersService.updateAvatar(req.user!.id, req.file);
    sendSuccess(res, { user }, "Photo updated");
  },

  async removeAvatar(req: Request, res: Response) {
    const user = await usersService.removeAvatar(req.user!.id);
    sendSuccess(res, { user }, "Photo removed");
  },
};
