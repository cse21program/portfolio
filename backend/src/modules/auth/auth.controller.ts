import type { Request, Response } from "express";
import { sendSuccess } from "@common/utils/apiResponse";
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "@common/utils/cookies";
import { authService } from "./auth.service";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RequestMeta,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.types";

function requestMeta(req: Request): RequestMeta {
  return {
    userAgent: req.get("user-agent") ?? undefined,
    ip: req.ip,
  };
}

function readRefreshToken(req: Request) {
  return typeof req.cookies?.[REFRESH_COOKIE] === "string"
    ? req.cookies[REFRESH_COOKIE]
    : undefined;
}

export const authController = {
  register: async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput, requestMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(
      res,
      {
        user: result.user,
        ...(result.verificationUrl ? { verificationUrl: result.verificationUrl } : {}),
      },
      "Account created",
      201,
    );
  },

  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput, requestMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user }, "Logged in");
  },

  logout: async (req: Request, res: Response) => {
    await authService.logout(readRefreshToken(req));
    clearAuthCookies(res);
    sendSuccess(res, null, "Logged out");
  },

  logoutAll: async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.id);
    clearAuthCookies(res);
    sendSuccess(res, null, "Logged out of all sessions");
  },

  refresh: async (req: Request, res: Response) => {
    const result = await authService.refresh(readRefreshToken(req), requestMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user }, "Session refreshed");
  },

  me: async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    sendSuccess(res, { user }, "Current user");
  },

  verifyEmail: async (req: Request, res: Response) => {
    const user = await authService.verifyEmail((req.body as VerifyEmailInput).token);
    sendSuccess(res, { user }, "Email verified");
  },

  resendVerification: async (req: Request, res: Response) => {
    const result = await authService.resendVerification(req.user!.id);
    sendSuccess(
      res,
      result,
      result.alreadyVerified ? "Email already verified" : "Verification email sent",
    );
  },

  forgotPassword: async (req: Request, res: Response) => {
    const result = await authService.forgotPassword((req.body as ForgotPasswordInput).email);
    sendSuccess(res, result, "If an account exists, a reset link has been sent");
  },

  resetPassword: async (req: Request, res: Response) => {
    await authService.resetPassword(req.body as ResetPasswordInput);
    clearAuthCookies(res);
    sendSuccess(res, null, "Password updated");
  },

  changePassword: async (req: Request, res: Response) => {
    const result = await authService.changePassword(
      req.user!.id,
      req.body as ChangePasswordInput,
      requestMeta(req),
    );
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user }, "Password updated");
  },
};
