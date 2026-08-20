import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { searchService } from "./search.service";
import { searchQuerySchema } from "./search.validation";

export const searchController = {
  async search(req: Request, res: Response) {
    const input = searchQuerySchema.parse(req.query);
    const payload = await searchService.search(input);
    res.setHeader("Cache-Control", "public, no-cache");
    sendSuccess(res, payload);
  },
};
