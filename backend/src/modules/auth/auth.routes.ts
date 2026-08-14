import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { validateRequest } from "@common/middleware/validateRequest";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  validateRequest(loginSchema),
  asyncHandler(authController.login),
);

router.post("/logout", asyncHandler(authController.logout));

export const authRouter = router;
