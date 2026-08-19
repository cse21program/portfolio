import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { validateRequest } from "@common/middleware/validateRequest";
import { courseCertificatesController } from "./course-certificates.controller";
import { publicIdParamsSchema } from "./course-certificates.validation";
import type { AppModule } from "@common/types/module";

const router = Router();

const readLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyFn: (req) => `course-cert:${req.ip ?? "unknown"}`,
  message: "Too many certificate lookups. Try again in a few minutes.",
});

router.get(
  "/:publicId",
  readLimit,
  validateRequest(publicIdParamsSchema, "params"),
  asyncHandler(courseCertificatesController.getByPublicId),
);

export const courseCertificatesModule: AppModule = {
  name: "course-certificates",
  basePath: "/course-certificates",
  router,
};
