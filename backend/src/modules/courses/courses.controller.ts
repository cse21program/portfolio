import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { coursesService } from "./courses.service";
import type { UpdateCourseListInput } from "./courses.validation";

export const coursesController = {
  async list(req: Request, res: Response) {
    const courses = await coursesService.list(req.user);
    res.setHeader("Cache-Control", req.user?.role === "ADMIN" ? "private, no-store" : "public, no-cache");
    sendSuccess(res, { courses });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = String(req.params.slug ?? "");
    const payload = await coursesService.getBySlug(slug, req.user);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, payload);
  },

  async replaceAll(req: Request, res: Response) {
    const courses = await coursesService.replaceAll(req.body as UpdateCourseListInput, {
      id: req.user!.id,
      email: req.user!.email,
    });
    sendSuccess(res, { courses }, "Courses updated");
  },
};
