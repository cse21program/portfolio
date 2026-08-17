import { createHash, randomBytes } from "node:crypto";
import { env, googleOAuthEnabled } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

function base64Url(bytes: Buffer) {
  return bytes.toString("base64url");
}

export function createGoogleOAuthRequest() {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const state = base64Url(randomBytes(24));
  return { verifier, challenge, state };
}

export function googleAuthorizationUrl(state: string, challenge: string, redirectUri: string) {
  if (!googleOAuthEnabled || !env.GOOGLE_CLIENT_ID) {
    throw new AppError(ErrorCode.NOT_IMPLEMENTED, "Google sign-in is not configured", 501);
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function fetchGoogleProfile(
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<GoogleProfile> {
  if (!googleOAuthEnabled || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError(ErrorCode.NOT_IMPLEMENTED, "Google sign-in is not configured", 501);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokens.access_token) {
    logger.warn("google.token.rejected", { status: tokenResponse.status, error: tokens.error });
    throw new AppError(ErrorCode.UNAUTHORIZED, "Google sign-in failed", 401);
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = (await profileResponse.json()) as GoogleUserInfo;

  if (!profileResponse.ok || !profile.sub || !profile.email) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Google sign-in failed", 401);
  }

  return {
    sub: profile.sub,
    email: profile.email.toLowerCase(),
    emailVerified: Boolean(profile.email_verified),
    name: profile.name?.trim() || null,
  };
}
