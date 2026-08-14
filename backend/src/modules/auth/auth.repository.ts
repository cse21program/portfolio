import { prisma } from "@common/database/prisma";
import type { AuthTokenType, Role } from "../../generated/prisma/client";

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
  }) {
    return prisma.user.create({ data });
  },

  updateUser(
    id: string,
    data: {
      name?: string;
      passwordHash?: string;
      emailVerified?: boolean;
      status?: "ACTIVE" | "SUSPENDED" | "DELETED";
    },
  ) {
    return prisma.user.update({ where: { id }, data });
  },

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  revokeAllRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  createAuthToken(data: {
    userId: string;
    type: AuthTokenType;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.authToken.create({ data });
  },

  findAuthTokenByHash(tokenHash: string) {
    return prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  markAuthTokenUsed(id: string) {
    return prisma.authToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  invalidateAuthTokens(userId: string, type: AuthTokenType) {
    return prisma.authToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
  },
};
