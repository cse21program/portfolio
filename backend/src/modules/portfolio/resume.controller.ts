import type { Request, Response } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendSuccess } from "@common/utils/apiResponse";
import { parseEtag, profileEtag } from "./portfolio.media";
import { resumeService } from "./resume.service";
import type { UpdateResumeInput } from "./resume.validation";

function expectedVersionFrom(req: Request) {
  const expectedVersion = parseEtag(req.header("if-match"));
  if (expectedVersion === null) {
    throw new AppError(
      ErrorCode.PRECONDITION_REQUIRED,
      "If-Match header with the current version is required",
      428,
    );
  }

  if (expectedVersion === "*") {
    throw new AppError(
      ErrorCode.PRECONDITION_FAILED,
      "Wildcard If-Match is not allowed for this resource",
      412,
    );
  }

  return expectedVersion;
}

export const resumeController = {
  async getResume(req: Request, res: Response) {
    const resume = await resumeService.getResume();
    const etag = profileEtag(resume.version);

    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", new Date(resume.updatedAt).toUTCString());
    res.setHeader("Cache-Control", "public, no-cache");

    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    sendSuccess(res, { resume });
  },

  async updateResume(req: Request, res: Response) {
    const resume = await resumeService.updateResume(
      req.body as UpdateResumeInput,
      expectedVersionFrom(req),
      { id: req.user!.id, email: req.user!.email },
    );

    res.setHeader("ETag", profileEtag(resume.version));
    sendSuccess(res, { resume }, "Resume updated");
  },
};
