import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { requireRole } from "@common/middleware/requireRole";
import { validateRequest } from "@common/middleware/validateRequest";
import type { AppModule } from "@common/types/module";
import { paymentsController } from "./payments.controller";
import {
  demoPaymentSchema,
  paymentIdParamsSchema,
  paymentProviderParamsSchema,
  reportPaymentSchema,
  startPaymentSchema,
  updateProviderSettingSchema,
} from "./payments.validation";

const router = Router();

const mutateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `payment:${req.user?.id ?? req.ip ?? "unknown"}`,
  message: "Too many payment attempts. Try again in a few minutes.",
});

router.get("/providers", asyncHandler(paymentsController.listProviders));
router.get(
  "/admin/providers",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(paymentsController.listAdminProviders),
);
router.patch(
  "/admin/providers/:provider",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(paymentProviderParamsSchema, "params"),
  validateRequest(updateProviderSettingSchema),
  asyncHandler(paymentsController.updateAdminProvider),
);
router.post(
  "/",
  requireAuth,
  mutateLimit,
  validateRequest(startPaymentSchema),
  asyncHandler(paymentsController.start),
);
router.post(
  "/webhooks/:provider",
  validateRequest(paymentProviderParamsSchema, "params"),
  asyncHandler(paymentsController.webhook),
);
router.get(
  "/:id",
  requireAuth,
  validateRequest(paymentIdParamsSchema, "params"),
  asyncHandler(paymentsController.getById),
);
router.post(
  "/:id/demo",
  requireAuth,
  mutateLimit,
  validateRequest(paymentIdParamsSchema, "params"),
  validateRequest(demoPaymentSchema),
  asyncHandler(paymentsController.demoComplete),
);
router.post(
  "/:id/report",
  requireAuth,
  mutateLimit,
  validateRequest(paymentIdParamsSchema, "params"),
  validateRequest(reportPaymentSchema),
  asyncHandler(paymentsController.reportTransfer),
);
router.post(
  "/:id/confirm",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(paymentIdParamsSchema, "params"),
  asyncHandler(paymentsController.confirm),
);
router.post(
  "/:id/sync",
  requireAuth,
  mutateLimit,
  validateRequest(paymentIdParamsSchema, "params"),
  asyncHandler(paymentsController.sync),
);
router.post(
  "/:id/refund",
  requireAuth,
  requireRole("ADMIN"),
  mutateLimit,
  validateRequest(paymentIdParamsSchema, "params"),
  asyncHandler(paymentsController.refund),
);

export const paymentsModule: AppModule = {
  name: "payments",
  basePath: "/payments",
  router,
};
