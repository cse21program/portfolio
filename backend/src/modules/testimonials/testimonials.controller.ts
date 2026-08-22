import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { testimonialsService } from "./testimonials.service";
import type { FromReviewInput, UpdateTestimonialListInput } from "./testimonials.validation";

function actor(req: Request) {
  return {
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  };
}

export const testimonialsController = {
  async list(req: Request, res: Response) {
    const testimonials = await testimonialsService.list(req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, { testimonials });
  },

  async getAdmin(req: Request, res: Response) {
    const payload = await testimonialsService.getAdmin(actor(req));
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const testimonials = await testimonialsService.replaceAll(req.body as UpdateTestimonialListInput, actor(req));
    sendSuccess(res, { testimonials }, "Testimonials updated");
  },

  async createFromReview(req: Request, res: Response) {
    const testimonial = await testimonialsService.createFromReview(req.body as FromReviewInput, actor(req));
    sendSuccess(res, { testimonial }, "Testimonial created from review");
  },
};
