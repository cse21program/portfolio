import type { CookieOptions, Response } from "express";
import { env, isDev } from "@common/config/env";
import { parseDurationMs } from "./duration";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: !isDev,
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
