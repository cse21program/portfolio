import { Router } from "express";
import type { RequestHandler } from "express";
import multer from "multer";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import {
  allowedMimeMessage,
  ensureUploadDir,
  extensionFor,
  getUploadDir,
  IMAGE_MAX_BYTES,
  newStoredName,
  sizeLimitMessage,
} from "@modules/media/media.storage";
import { usersController } from "./users.controller";
import { updateProfileSchema } from "./users.validation";

const router = Router();

const updateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `profile:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many profile updates. Try again in a few minutes.",
});

const receiveAvatar: RequestHandler = (req, res, next) => {
  ensureUploadDir();
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, getUploadDir()),
      filename: (_req, file, cb) => {
        const name = newStoredName("image", file.mimetype, file.originalname);
        if (!name) {
          cb(new AppError(ErrorCode.VALIDATION_ERROR, allowedMimeMessage("image"), 400), "");
          return;
        }
        cb(null, name);
      },
    }),
    limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!extensionFor("image", file.mimetype, file.originalname)) {
        cb(new AppError(ErrorCode.VALIDATION_ERROR, allowedMimeMessage("image"), 400));
        return;
      }
      cb(null, true);
    },
  }).single("file");

  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new AppError(ErrorCode.VALIDATION_ERROR, sizeLimitMessage("image"), 400));
        return;
      }
      next(new AppError(ErrorCode.VALIDATION_ERROR, "Could not upload that photo", 400));
      return;
    }
    next(err);
  });
};

router.get("/me", requireAuth, asyncHandler(usersController.me));
router.patch(
  "/me",
  requireAuth,
  updateLimit,
  validateRequest(updateProfileSchema),
  asyncHandler(usersController.update),
);
router.post(
  "/me/avatar",
  requireAuth,
  updateLimit,
  receiveAvatar,
  asyncHandler(usersController.updateAvatar),
);
router.delete("/me/avatar", requireAuth, updateLimit, asyncHandler(usersController.removeAvatar));

export const usersModule: AppModule = {
  name: "users",
  basePath: "/users",
  router,
};
