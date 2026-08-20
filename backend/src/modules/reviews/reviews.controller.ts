import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { reviewsService } from "./reviews.service";
import {
  listPublicReviewsSchema,
  type CreateReviewInput,
  type UpdateAdminReviewInput,
  type UpdateReviewInput,
} from "./reviews.validation";

function actor(req: Request) {
  return {
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  };
}

export const reviewsController = {
  async listPublic(req: Request, res: Response) {
    const input = listPublicReviewsSchema.parse(req.query);
    const payload = await reviewsService.listPublic(input);
    res.setHeader("Cache-Control", "public, max-age=30");
    sendSuccess(res, payload);
  },

  async listMine(req: Request, res: Response) {
    const reviews = await reviewsService.listMine(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { reviews });
  },

  async listEligible(req: Request, res: Response) {
    const products = await reviewsService.listEligible(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { products });
  },

  async listAdmin(_req: Request, res: Response) {
    const reviews = await reviewsService.listAdmin();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { reviews });
  },

  async create(req: Request, res: Response) {
    const review = await reviewsService.create(req.body as CreateReviewInput, actor(req));
    sendSuccess(res, { review }, "Review submitted", 201);
  },

  async updateMine(req: Request, res: Response) {
    const review = await reviewsService.updateMine(
      String(req.params.id ?? ""),
      req.body as UpdateReviewInput,
      actor(req),
    );
    sendSuccess(res, { review }, "Review updated");
  },

  async deleteMine(req: Request, res: Response) {
    await reviewsService.deleteMine(String(req.params.id ?? ""), actor(req));
    sendSuccess(res, null, "Review removed");
  },

  async updateAdmin(req: Request, res: Response) {
    const review = await reviewsService.updateAdmin(
      String(req.params.id ?? ""),
      req.body as UpdateAdminReviewInput,
      actor(req),
    );
    sendSuccess(res, { review }, "Review updated");
  },
};
