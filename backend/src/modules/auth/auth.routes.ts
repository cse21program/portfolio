import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { createRateLimit } from "@common/middleware/rateLimit";
import { requireAuth } from "@common/middleware/requireAuth";
import { validateRequest } from "@common/middleware/validateRequest";
import { authController } from "./auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation";

const router = Router();

const googleAttemptLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `google:${req.ip ?? "unknown"}`,
  message: "Too many attempts. Try again in a few minutes.",
});

router.get("/providers", asyncHandler(authController.providers));
router.get("/google", googleAttemptLimit, asyncHandler(authController.googleStart));
router.get("/google/callback", asyncHandler(authController.googleCallback));

const authAttemptLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyFn: (req) => `${req.ip}:${String((req.body as { email?: string })?.email ?? "")}`,
  message: "Too many attempts. Try again in a few minutes.",
});

router.post(
  "/register",
  authAttemptLimit,
  validateRequest(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  authAttemptLimit,
  validateRequest(loginSchema),
  asyncHandler(authController.login),
);

router.post("/logout", asyncHandler(authController.logout));
router.post("/refresh", asyncHandler(authController.refresh));

router.get("/me", requireAuth, asyncHandler(authController.me));

router.post(
  "/verify-email",
  validateRequest(verifyEmailSchema),
  asyncHandler(authController.verifyEmail),
);

router.post("/resend-verification", requireAuth, asyncHandler(authController.resendVerification));

router.post(
  "/forgot-password",
  authAttemptLimit,
  validateRequest(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

router.post(
  "/change-password",
  requireAuth,
  validateRequest(changePasswordSchema),
  asyncHandler(authController.changePassword),
);

router.post("/logout-all", requireAuth, asyncHandler(authController.logoutAll));

export const authRouter = router;
