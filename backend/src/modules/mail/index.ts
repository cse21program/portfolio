import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { mailController } from "./mail.controller";
import {
  mailProviderParamsSchema,
  setMailTransportSchema,
  testMailSchema,
  updateMailProviderSchema,
} from "./mail.validation";

const router = Router();

const mutateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `mail:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many mail updates. Try again in a few minutes.",
});

router.get("/admin", requireAuth, requireRole("ADMIN"), asyncHandler(mailController.getAdmin));
router.patch(
  "/admin/providers/:provider",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(mailProviderParamsSchema, "params"),
  validateRequest(updateMailProviderSchema),
  asyncHandler(mailController.updateProvider),
);
router.put(
  "/admin/transport",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(setMailTransportSchema),
  asyncHandler(mailController.setTransport),
);
router.post(
  "/admin/test",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(testMailSchema),
  asyncHandler(mailController.sendTest),
);

export const mailModule: AppModule = {
  name: "mail",
  basePath: "/mail",
  router,
};
