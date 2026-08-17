import bcrypt from "bcryptjs";
import { env, isDev } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { generateToken, hashToken } from "@common/utils/crypto";
import { parseDurationMs } from "@common/utils/duration";
import { signAccessToken } from "@common/utils/jwt";
import { logger } from "@common/utils/logger";
import type { AuthTokenType, User } from "../../generated/prisma/client";
import { authRepository } from "./auth.repository";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  RequestMeta,
  ResetPasswordInput,
} from "./auth.types";
import type { GoogleProfile } from "./google.oauth";

const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function toPublicUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    status: user.status,
    hasPassword: Boolean(user.passwordHash),
    googleLinked: Boolean(user.googleId),
  };
}

function assertActive(user: User) {
  if (user.status === "SUSPENDED") {
    throw new AppError(ErrorCode.FORBIDDEN, "This account has been suspended", 403);
  }
  if (user.status === "DELETED") {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid email or password", 401);
  }
}

async function issueSession(user: User, meta: RequestMeta): Promise<AuthSession> {
  const refreshToken = generateToken();
  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN)),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

function bootstrapEmail() {
  return env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase() || "";
}

function isBootstrapAdmin(email: string) {
  const expected = bootstrapEmail();
  return Boolean(expected && email.toLowerCase() === expected);
}

function roleForEmail(email: string) {
  return isBootstrapAdmin(email) ? "ADMIN" : "CUSTOMER";
}

async function withBootstrapRole(user: User): Promise<User> {
  if (user.role === "ADMIN" || !isBootstrapAdmin(user.email)) {
    return user;
  }

  logger.info("auth.bootstrap.promoted", { userId: user.id });
  return authRepository.updateUser(user.id, { role: "ADMIN" });
}

async function issueAuthToken(userId: string, type: AuthTokenType, ttlMs: number) {
  await authRepository.invalidateAuthTokens(userId, type);
  const token = generateToken();
  await authRepository.createAuthToken({
    userId,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

function verificationUrl(token: string) {
  return `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

function resetUrl(token: string) {
  return `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

export const authService = {
  async register(input: RegisterInput, meta: RequestMeta) {
    const email = input.email.toLowerCase();
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new AppError(ErrorCode.CONFLICT, "An account with this email already exists", 409);
    }

    const role = roleForEmail(email);

    const user = await authRepository.createUser({
      email,
      name: input.name,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      role,
    });

    const token = await issueAuthToken(user.id, "EMAIL_VERIFY", EMAIL_VERIFY_TTL_MS);
    const url = verificationUrl(token);
    logger.info(`Email verification link for ${email}: ${url}`);

    const session = await issueSession(user, meta);
    return {
      ...session,
      ...(isDev ? { verificationUrl: url } : {}),
    };
  },

  async login(input: LoginInput, meta: RequestMeta) {
    const user = await authRepository.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid email or password", 401);
    }

    if (!user.passwordHash) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "This account uses Google sign-in", 401);
    }

    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid email or password", 401);
    }

    assertActive(user);
    return issueSession(await withBootstrapRole(user), meta);
  },

  async loginWithGoogle(profile: GoogleProfile, meta: RequestMeta) {
    if (!profile.emailVerified) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Google did not verify this email address",
        401,
      );
    }

    let user = await authRepository.findByGoogleId(profile.sub);
    if (!user) {
      user = await authRepository.findByEmail(profile.email);
      if (user) {
        user = await authRepository.updateUser(user.id, {
          googleId: profile.sub,
          emailVerified: true,
          name: user.name ?? profile.name,
        });
      } else {
        const role = roleForEmail(profile.email);
        user = await authRepository.createUser({
          email: profile.email,
          googleId: profile.sub,
          name: profile.name,
          role,
          emailVerified: true,
        });
      }
    }

    assertActive(user);
    return issueSession(await withBootstrapRole(user), meta);
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    const stored = await authRepository.findRefreshTokenByHash(hashToken(refreshToken));
    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  },

  async logoutAll(userId: string) {
    await authRepository.revokeAllRefreshTokens(userId);
  },

  async refresh(refreshToken: string | undefined, meta: RequestMeta) {
    if (!refreshToken) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Refresh token missing", 401);
    }

    const stored = await authRepository.findRefreshTokenByHash(hashToken(refreshToken));
    if (!stored) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired session", 401);
    }

    if (stored.revokedAt) {
      await authRepository.revokeAllRefreshTokens(stored.userId);
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired session", 401);
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired session", 401);
    }

    assertActive(stored.user);
    await authRepository.revokeRefreshToken(stored.id);
    return issueSession(await withBootstrapRole(stored.user), meta);
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
    }

    assertActive(user);
    return toPublicUser(await withBootstrapRole(user));
  },

  async verifyEmail(token: string) {
    const stored = await authRepository.findAuthTokenByHash(hashToken(token));
    if (
      !stored ||
      stored.type !== "EMAIL_VERIFY" ||
      stored.usedAt ||
      stored.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid or expired verification link", 400);
    }

    await authRepository.markAuthTokenUsed(stored.id);
    const user = await authRepository.updateUser(stored.userId, { emailVerified: true });
    return toPublicUser(user);
  },

  async resendVerification(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "User not found", 404);
    }

    if (user.emailVerified) {
      return { alreadyVerified: true as const };
    }

    const token = await issueAuthToken(user.id, "EMAIL_VERIFY", EMAIL_VERIFY_TTL_MS);
    const url = verificationUrl(token);
    logger.info(`Email verification link for ${user.email}: ${url}`);
    return {
      alreadyVerified: false as const,
      ...(isDev ? { verificationUrl: url } : {}),
    };
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findByEmail(email.toLowerCase());
    if (!user || user.status === "DELETED") {
      return {};
    }

    const token = await issueAuthToken(user.id, "PASSWORD_RESET", PASSWORD_RESET_TTL_MS);
    const url = resetUrl(token);
    logger.info(`Password reset link for ${user.email}: ${url}`);
    return isDev ? { resetUrl: url } : {};
  },

  async resetPassword(input: ResetPasswordInput) {
    const stored = await authRepository.findAuthTokenByHash(hashToken(input.token));
    if (
      !stored ||
      stored.type !== "PASSWORD_RESET" ||
      stored.usedAt ||
      stored.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid or expired reset link", 400);
    }

    await authRepository.markAuthTokenUsed(stored.id);
    await authRepository.invalidateAuthTokens(stored.userId, "PASSWORD_RESET");
    await authRepository.updateUser(stored.userId, {
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
    });
    await authRepository.revokeAllRefreshTokens(stored.userId);
  },

  async changePassword(userId: string, input: ChangePasswordInput, meta: RequestMeta) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "User not found", 404);
    }

    if (user.passwordHash) {
      if (!input.currentPassword) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Current password is required", 400);
      }
      const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!matches) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Current password is incorrect", 401);
      }
    }

    const updated = await authRepository.updateUser(userId, {
      passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS),
    });
    await authRepository.revokeAllRefreshTokens(userId);
    return issueSession(updated, meta);
  },
};
