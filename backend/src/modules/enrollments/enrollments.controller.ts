import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { enrollmentsService } from "./enrollments.service";
import type { EnrollInput, GrantEnrollmentInput, LessonProgressInput } from "./enrollments.validation";

function actor(req: Request) {
  return {
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  };
}

export const enrollmentsController = {
  async listMine(req: Request, res: Response) {
    const enrollments = await enrollmentsService.listMine(req.user!.id);
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { enrollments });
  },

  async enroll(req: Request, res: Response) {
    const { enrollment, created } = await enrollmentsService.enroll(req.body as EnrollInput, actor(req));
    sendSuccess(res, { enrollment }, created ? "Enrolled" : "Already enrolled", created ? 201 : 200);
  },

  async cancelMine(req: Request, res: Response) {
    const enrollment = await enrollmentsService.cancelMine(String(req.params.courseSlug ?? ""), actor(req));
    sendSuccess(res, { enrollment }, "Enrollment canceled");
  },

  async listAdmin(_req: Request, res: Response) {
    const enrollments = await enrollmentsService.listAdmin();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { enrollments });
  },

  async grant(req: Request, res: Response) {
    const { enrollment, created } = await enrollmentsService.grant(
      req.body as GrantEnrollmentInput,
      actor(req),
    );
    sendSuccess(res, { enrollment }, created ? "Seat granted" : "Already enrolled", created ? 201 : 200);
  },

  async revoke(req: Request, res: Response) {
    const enrollment = await enrollmentsService.revoke(String(req.params.id ?? ""), actor(req));
    sendSuccess(res, { enrollment }, "Enrollment revoked");
  },

  async setProgress(req: Request, res: Response) {
    const enrollment = await enrollmentsService.setProgress(
      String(req.params.courseSlug ?? ""),
      req.body as LessonProgressInput,
      actor(req),
    );
    sendSuccess(res, { enrollment }, "Progress saved");
  },
};
