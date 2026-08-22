import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { followsService } from "./follows.service";
import { followAdminQuerySchema } from "./follows.validation";

function privateNoStore(res: Response) {
  res.setHeader("Cache-Control", "private, no-store");
}

export const followsController = {
  async getStudio(req: Request, res: Response) {
    const payload = await followsService.getStudio(req.user?.id);
    privateNoStore(res);
    sendSuccess(res, payload);
  },

  async followStudio(req: Request, res: Response) {
    const payload = await followsService.followStudio(req.user!.id);
    privateNoStore(res);
    sendSuccess(res, payload, "Following");
  },

  async unfollowStudio(req: Request, res: Response) {
    const payload = await followsService.unfollowStudio(req.user!.id);
    privateNoStore(res);
    sendSuccess(res, payload, "Unfollowed");
  },

  async listStudioAdmin(req: Request, res: Response) {
    const query = followAdminQuerySchema.parse(req.query);
    const { follows, total } = await followsService.listStudioAdmin(query.page, query.limit);
    privateNoStore(res);
    sendSuccess(res, {
      follows,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit) || 1),
    });
  },

  async removeStudioFollower(req: Request, res: Response) {
    const followerCount = await followsService.removeStudioFollower(String(req.params.userId ?? ""));
    privateNoStore(res);
    sendSuccess(res, { followerCount }, "Follower removed");
  },
};
