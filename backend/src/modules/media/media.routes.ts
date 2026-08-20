import type { RequestHandler } from "express";
import { Router } from "express";
import multer from "multer";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import { mediaController } from "./media.controller";
import { mediaIdParamsSchema, updateMediaSchema } from "./media.validation";
import {
  allowedMimeMessage,
  ensureUploadDir,
  extensionFor,
  getUploadDir,
  maxBytesFor,
  newStoredName,
  parseKind,
  sizeLimitMessage,
} from "./media.storage";

const router = Router();

const uploadLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `media:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many uploads. Try again in a few minutes.",
});

const receiveFile: RequestHandler = (req, res, next) => {
  const kind = parseKind(req.query.kind);
  if (!kind) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, "Upload kind must be image, video, or document", 400));
    return;
  }

  ensureUploadDir();

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, getUploadDir()),
      filename: (_req, file, cb) => {
        const name = newStoredName(kind, file.mimetype, file.originalname);
        if (!name) {
          cb(new AppError(ErrorCode.VALIDATION_ERROR, allowedMimeMessage(kind), 400), "");
          return;
        }
        cb(null, name);
      },
    }),
    limits: { fileSize: maxBytesFor(kind), files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!extensionFor(kind, file.mimetype, file.originalname)) {
        cb(new AppError(ErrorCode.VALIDATION_ERROR, allowedMimeMessage(kind), 400));
        return;
      }
      cb(null, true);
    },
  }).single("file");

  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(
          new AppError(
            ErrorCode.VALIDATION_ERROR,
            sizeLimitMessage(kind),
            400,
          ),
        );
        return;
      }
      next(new AppError(ErrorCode.VALIDATION_ERROR, "Could not upload that file", 400));
      return;
    }
    next(err);
  });
};

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => mediaController.list(req, res)),
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  uploadLimit,
  receiveFile,
  asyncHandler(async (req, res) => mediaController.upload(req, res)),
);

router.get("/files/:filename", asyncHandler(async (req, res) => mediaController.getFile(req, res)));

router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(mediaIdParamsSchema, "params"),
  validateRequest(updateMediaSchema),
  asyncHandler(async (req, res) => mediaController.update(req, res)),
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(mediaIdParamsSchema, "params"),
  asyncHandler(async (req, res) => mediaController.remove(req, res)),
);

export const mediaRouter = router;
