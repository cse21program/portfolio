import type { Request, Response } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendSuccess } from "@common/utils/apiResponse";
import { parseEtag, profileEtag } from "./portfolio.media";
import { toPublicAboutProfile } from "./portfolio.types";
import { portfolioService } from "./portfolio.service";
import type { UpdateAboutInput, UpdateGalleryInput } from "./portfolio.validation";

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

export const portfolioController = {
  async getAbout(req: Request, res: Response) {
    const profile = await portfolioService.getAbout();
    const visible = toPublicAboutProfile(profile);
    const etag = profileEtag(profile.version);

    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", new Date(profile.updatedAt).toUTCString());
    res.setHeader("Cache-Control", "public, no-cache");

    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    sendSuccess(res, { profile: visible });
  },

  async getStudioAbout(req: Request, res: Response) {
    const profile = await portfolioService.getAbout();
    const etag = profileEtag(profile.version);

    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", new Date(profile.updatedAt).toUTCString());
    res.setHeader("Cache-Control", "private, no-store");

    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    sendSuccess(res, { profile });
  },

  async updateAbout(req: Request, res: Response) {
    const profile = await portfolioService.updateAbout(
      req.body as UpdateAboutInput,
      expectedVersionFrom(req),
      { id: req.user!.id, email: req.user!.email },
    );

    res.setHeader("ETag", profileEtag(profile.version));
    sendSuccess(res, { profile }, "About profile updated");
  },

  async updateGallery(req: Request, res: Response) {
    const body = req.body as UpdateGalleryInput;
    const profile = await portfolioService.updateGallery(
      body.gallery,
      expectedVersionFrom(req),
      { id: req.user!.id, email: req.user!.email },
    );

    res.setHeader("ETag", profileEtag(profile.version));
    sendSuccess(res, { profile }, "Gallery updated");
  },
};
