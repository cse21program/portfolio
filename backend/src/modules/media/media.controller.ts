import type { Request, Response } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendSuccess } from "@common/utils/apiResponse";
import { persistUploadedFile, sendStoredFile } from "./media.files";
import { parseKind, publicFileUrl } from "./media.storage";

export const mediaController = {
  async upload(req: Request, res: Response) {
    const kind = parseKind(req.query.kind);
    const file = req.file;
    if (!kind || !file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Choose a file to upload", 400);
    }

    await persistUploadedFile(file);

    return sendSuccess(
      res,
      {
        kind,
        filename: file.filename,
        contentType: file.mimetype,
        url: publicFileUrl(file.filename),
      },
      "Uploaded",
      201,
    );
  },

  async getFile(req: Request, res: Response) {
    await sendStoredFile(req, res);
  },
};
