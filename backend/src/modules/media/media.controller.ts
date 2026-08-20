import type { Request, Response } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendSuccess } from "@common/utils/apiResponse";
import { persistUploadedFile, sendStoredFile } from "./media.files";
import { mediaService } from "./media.service";
import { parseKind, publicFileUrl } from "./media.storage";
import type { UpdateMediaInput } from "./media.validation";

export const mediaController = {
  async list(_req: Request, res: Response) {
    const { assets, summary } = await mediaService.list();
    res.setHeader("Cache-Control", "private, no-store");
    sendSuccess(res, { assets, summary });
  },

  async upload(req: Request, res: Response) {
    const kind = parseKind(req.query.kind);
    const file = req.file;
    if (!kind || !file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Choose a file to upload", 400);
    }

    // Copy to S3 after the JSON reply. Waiting here used to hold the CloudFront
    // origin until it returned the website HTML to Studio.
    void persistUploadedFile(file);
    const asset = await mediaService.recordUpload(file, kind);

    return sendSuccess(
      res,
      {
        kind,
        filename: file.filename,
        contentType: file.mimetype,
        url: publicFileUrl(file.filename),
        asset,
      },
      "Uploaded",
      201,
    );
  },

  async update(req: Request, res: Response) {
    const asset = await mediaService.update(String(req.params.id ?? ""), req.body as UpdateMediaInput);
    sendSuccess(res, { asset }, "Media updated");
  },

  async remove(req: Request, res: Response) {
    await mediaService.remove(String(req.params.id ?? ""));
    sendSuccess(res, null, "Media removed");
  },

  async getFile(req: Request, res: Response) {
    await sendStoredFile(req, res);
  },
};
