import type { Request, Response } from "express";
import { env, googleOAuthEnabled } from "@common/config/env";
import { AppError } from "@common/errors/AppError";
import { sendSuccess } from "@common/utils/apiResponse";
import { logger } from "@common/utils/logger";
import { signAccessToken } from "@common/utils/jwt";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  clearOAuthCookies,
  setAuthCookies,
  setAccessCookie,
  setOAuthCookies,
  REFRESH_COOKIE,
  clearAuthCookies,
} from "@common/utils/cookies";
import { authService } from "./auth.service";
import { googleCallbackUrl } from "./google.callback-url";
import {
  createGoogleOAuthRequest,
  fetchGoogleProfile,
  googleAuthorizationUrl,
} from "./google.oauth";
import { rememberOAuth, takeOAuth } from "./oauth-state";
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

function safeNextPath(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("://")
  ) {
    return undefined;
  }
  return value;
}

function postLoginPath(role: "CUSTOMER" | "ADMIN", next?: string) {
  if (next && next !== "/login" && next !== "/register") {
    return next;
  }
  return role === "ADMIN" ? "/admin" : "/dashboard";
}

function redirectToLogin(res: Response, error: string) {
  const url = new URL("/login", env.FRONTEND_URL);
  url.searchParams.set("error", error);
  res.redirect(url.toString());
}

function googleErrorCode(error: unknown) {
  if (error instanceof AppError) {
    if (error.message.includes("not configured")) {
      return "google_not_configured";
    }
    if (error.message.includes("verify")) {
      return "google_email_unverified";
    }
  }
  return "google_failed";
}

export const authController = {
  providers: async (_req: Request, res: Response) => {
    sendSuccess(res, { google: googleOAuthEnabled }, "Auth providers");
  },

  googleStart: async (req: Request, res: Response) => {
    if (!googleOAuthEnabled) {
      redirectToLogin(res, "google_not_configured");
      return;
    }

    const request = createGoogleOAuthRequest();
    const next = safeNextPath(req.query.next);
    const redirectUri = googleCallbackUrl(req, {
      apiPrefix: env.API_PREFIX,
      fallbackOrigin: env.FRONTEND_URL,
    });
    rememberOAuth(request.state, {
      verifier: request.verifier,
      redirectUri,
      next,
    });
    setOAuthCookies(res, {
      state: request.state,
      verifier: request.verifier,
      next,
    });
    res.setHeader("Cache-Control", "private, no-store");
    res.redirect(googleAuthorizationUrl(request.state, request.challenge, redirectUri));
  },

  googleCallback: async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const pending = state ? takeOAuth(state) : undefined;
    const verifier = pending?.verifier ?? req.cookies?.[OAUTH_VERIFIER_COOKIE];
    const next = pending?.next ?? safeNextPath(req.cookies?.[OAUTH_NEXT_COOKIE]);
    const redirectUri =
      pending?.redirectUri ??
      googleCallbackUrl(req, {
        apiPrefix: env.API_PREFIX,
        fallbackOrigin: env.FRONTEND_URL,
      });
    const stateMatched = Boolean(pending) || (Boolean(state) && state === req.cookies?.[OAUTH_STATE_COOKIE]);
    clearOAuthCookies(res);
    res.setHeader("Cache-Control", "private, no-store");

    if (typeof req.query.error === "string") {
      redirectToLogin(res, req.query.error === "access_denied" ? "google_denied" : "google_failed");
      return;
    }

    if (!code || !state || !verifier || !stateMatched) {
      logger.warn("google.callback.rejected", {
        hasCode: Boolean(code),
        hasState: Boolean(state),
        hasVerifier: Boolean(verifier),
        stateMatched,
      });
      redirectToLogin(res, "google_failed");
      return;
    }

    try {
      const profile = await fetchGoogleProfile(code, verifier, redirectUri);
      const result = await authService.loginWithGoogle(profile, requestMeta(req));
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.redirect(new URL(postLoginPath(result.user.role, next), env.FRONTEND_URL).toString());
    } catch (error) {
      logger.warn("google.callback.failed", {
        code: error instanceof AppError ? error.code : "UNKNOWN",
      });
      redirectToLogin(res, googleErrorCode(error));
    }
  },
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
    if (user.role !== req.user!.role) {
      setAccessCookie(res, signAccessToken(user));
    }
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
