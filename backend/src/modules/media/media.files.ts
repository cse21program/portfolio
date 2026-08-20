import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import type { Request, Response } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { getMediaObject, putMediaObject, deleteMediaObject } from "./media.s3";
import {
  contentTypeFor,
  isSafeFilename,
  sanitizeDownloadName,
  storedFilePath,
  usesS3,
} from "./media.storage";

function setFileHeaders(res: Response, filename: string, req: Request) {
  res.setHeader("Content-Type", contentTypeFor(filename));
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  const isPdf = filename.toLowerCase().endsWith(".pdf");
  const forceDownload = String(req.query.download ?? "") === "1";
  const displayName = sanitizeDownloadName(req.query.name, isPdf ? "resume.pdf" : filename);
  res.setHeader(
    "Content-Disposition",
    `${forceDownload ? "attachment" : "inline"}; filename="${displayName}"`,
  );
}

export async function persistUploadedFile(file: Express.Multer.File) {
  if (!usesS3()) {
    return;
  }

  try {
    await putMediaObject(file.filename, file.path, contentTypeFor(file.filename));
  } catch (error) {
    logger.error("media.s3.put_failed", {
      name: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  await fs.promises.unlink(file.path).catch(() => undefined);
}

async function sendLocalFile(res: Response, req: Request, filename: string, filePath: string) {
  setFileHeaders(res, filename, req);
  await new Promise<void>((resolve, reject) => {
    res.sendFile(filePath, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function sendStoredFile(req: Request, res: Response) {
  const filename = String(req.params.filename ?? "");
  if (!isSafeFilename(filename)) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "File not found", 404);
  }

  // Prefer the local copy so a slow or hung S3 GetObject cannot stall the
  // preview after Studio already accepted the upload.
  const filePath = storedFilePath(filename);
  if (filePath && fs.existsSync(filePath)) {
    await sendLocalFile(res, req, filename, filePath);
    return;
  }

  if (usesS3()) {
    try {
      const object = await getMediaObject(filename);
      if (object) {
        setFileHeaders(res, filename, req);
        if (object.contentLength != null) {
          res.setHeader("Content-Length", String(object.contentLength));
        }
        try {
          await pipeline(object.body, res);
        } catch {
          if (!res.headersSent) {
            throw new AppError(ErrorCode.INTERNAL_ERROR, "Could not read that file", 500);
          }
        }
        return;
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("media.s3.get_failed", error);
    }
  }

  throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "File not found", 404);
}

export async function removeStoredFile(filename: string) {
  if (!isSafeFilename(filename)) {
    return;
  }

  const filePath = storedFilePath(filename);
  if (filePath) {
    await fs.promises.unlink(filePath).catch(() => undefined);
  }

  if (!usesS3()) {
    return;
  }

  try {
    await deleteMediaObject(filename);
  } catch (error) {
    logger.error("media.s3.delete_failed", {
      filename,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
