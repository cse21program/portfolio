import { Router } from "express";
import type { RequestHandler } from "express";
import multer from "multer";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { optionalAuth, requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import {
  ensureUploadDir,
  extensionFor,
  getUploadDir,
  IMAGE_MAX_BYTES,
  newStoredName,
  type MediaKind,
} from "@modules/media/media.storage";
import { contactController } from "./contact.controller";
import { contactIdParamsSchema, createContactSchema, updateContactSchema } from "./contact.validation";

const router = Router();

const createLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyFn: (req) => `contact:${req.ip ?? "unknown"}`,
  message: "Too many messages. Try again in a few minutes.",
});

function kindForFile(file: Express.Multer.File): MediaKind | null {
  if (extensionFor("document", file.mimetype, file.originalname)) {
    return "document";
  }
  if (extensionFor("image", file.mimetype, file.originalname)) {
    return "image";
  }
  return null;
}

const receiveOptionalFile: RequestHandler = (req, res, next) => {
  const contentType = String(req.headers["content-type"] ?? "");
  if (!contentType.includes("multipart/form-data")) {
    next();
    return;
  }

  ensureUploadDir();
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, getUploadDir()),
      filename: (_req, file, cb) => {
        const kind = kindForFile(file);
        const name = kind ? newStoredName(kind, file.mimetype, file.originalname) : null;
        if (!name) {
          cb(new AppError(ErrorCode.VALIDATION_ERROR, "Use a JPEG, PNG, WebP, GIF, or PDF", 400), "");
          return;
        }
        cb(null, name);
      },
    }),
    limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!kindForFile(file)) {
        cb(new AppError(ErrorCode.VALIDATION_ERROR, "Use a JPEG, PNG, WebP, GIF, or PDF", 400));
        return;
      }
      cb(null, true);
    },
  }).single("file");

  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new AppError(ErrorCode.VALIDATION_ERROR, "Attachment must be 5 MB or smaller", 400));
        return;
      }
      next(new AppError(ErrorCode.VALIDATION_ERROR, "Could not attach that file", 400));
      return;
    }
    next(err);
  });
};

router.post(
  "/",
  optionalAuth,
  createLimit,
  receiveOptionalFile,
  validateRequest(createContactSchema),
  asyncHandler(contactController.create),
);

router.get("/", requireAuth, requireRole("ADMIN"), asyncHandler(contactController.list));
router.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(contactIdParamsSchema, "params"),
  asyncHandler(contactController.getById),
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(contactIdParamsSchema, "params"),
  validateRequest(updateContactSchema),
  asyncHandler(contactController.update),
);

export const contactModule: AppModule = {
  name: "contact",
  basePath: "/contact",
  router,
};
