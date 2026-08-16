import fs from "node:fs";
import type { Request, Response } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendSuccess } from "@common/utils/apiResponse";
import {
  contentTypeFor,
  isSafeFilename,
  parseKind,
  publicFileUrl,
  storedFilePath,
} from "./media.storage";

export const mediaController = {
  upload(req: Request, res: Response) {
    const kind = parseKind(req.query.kind);
    const file = req.file;
    if (!kind || !file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Choose a file to upload", 400);
    }

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

  getFile(req: Request, res: Response) {
    const filename = String(req.params.filename ?? "");
    if (!isSafeFilename(filename)) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "File not found", 404);
    }

    const filePath = storedFilePath(filename);
    if (!filePath || !fs.existsSync(filePath)) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "File not found", 404);
    }

    res.setHeader("Content-Type", contentTypeFor(filename));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Disposition", "inline");
    return res.sendFile(filePath);
  },
};
