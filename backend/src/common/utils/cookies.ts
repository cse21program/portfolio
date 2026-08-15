import type { CookieOptions, Response } from "express";
import { env } from "@common/config/env";
import { parseDurationMs } from "./duration";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const OAUTH_STATE_COOKIE = "oauth_state";
export const OAUTH_VERIFIER_COOKIE = "oauth_verifier";
export const OAUTH_NEXT_COOKIE = "oauth_next";

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: parseDurationMs(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function clearAuthCookies(res: Response) {
  const options = baseCookieOptions();
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
}

export function setOAuthCookies(
  res: Response,
  values: { state: string; verifier: string; next?: string },
) {
  const options: CookieOptions = {
    ...baseCookieOptions(),
    maxAge: 10 * 60 * 1000,
  };
  res.cookie(OAUTH_STATE_COOKIE, values.state, options);
  res.cookie(OAUTH_VERIFIER_COOKIE, values.verifier, options);
  if (values.next) {
    res.cookie(OAUTH_NEXT_COOKIE, values.next, options);
  } else {
    res.clearCookie(OAUTH_NEXT_COOKIE, baseCookieOptions());
  }
}

export function clearOAuthCookies(res: Response) {
  const options = baseCookieOptions();
  res.clearCookie(OAUTH_STATE_COOKIE, options);
  res.clearCookie(OAUTH_VERIFIER_COOKIE, options);
  res.clearCookie(OAUTH_NEXT_COOKIE, options);
}
