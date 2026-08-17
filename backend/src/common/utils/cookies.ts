import type { CookieOptions, Response } from "express";
import { env } from "@common/config/env";
import { cookieDomainFromFrontend } from "./origins";
import { parseDurationMs } from "./duration";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const OAUTH_STATE_COOKIE = "oauth_state";
export const OAUTH_VERIFIER_COOKIE = "oauth_verifier";
export const OAUTH_NEXT_COOKIE = "oauth_next";

function cookieSecure() {
  return env.COOKIE_SECURE ?? env.NODE_ENV === "production";
}

function cookieDomain() {
  return cookieDomainFromFrontend(env.FRONTEND_URL);
}

function baseCookieOptions(): CookieOptions {
  const domain = cookieDomain();
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

function oauthCookieOptions(): CookieOptions {
  const domain = cookieDomain();
  const secure = cookieSecure();
  return {
    httpOnly: true,
    secure,
    // Google returns from a third-party host. Lax cookies set on that 302 are
    // often dropped; None keeps PKCE state if the in-memory store is empty.
    sameSite: secure ? "none" : "lax",
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  setAccessCookie(res, accessToken);
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function setAccessCookie(res: Response, accessToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: parseDurationMs(env.JWT_ACCESS_EXPIRES_IN),
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
    ...oauthCookieOptions(),
    maxAge: 10 * 60 * 1000,
  };
  res.cookie(OAUTH_STATE_COOKIE, values.state, options);
  res.cookie(OAUTH_VERIFIER_COOKIE, values.verifier, options);
  if (values.next) {
    res.cookie(OAUTH_NEXT_COOKIE, values.next, options);
  } else {
    res.clearCookie(OAUTH_NEXT_COOKIE, oauthCookieOptions());
  }
}

export function clearOAuthCookies(res: Response) {
  const options = oauthCookieOptions();
  res.clearCookie(OAUTH_STATE_COOKIE, options);
  res.clearCookie(OAUTH_VERIFIER_COOKIE, options);
  res.clearCookie(OAUTH_NEXT_COOKIE, options);
}
