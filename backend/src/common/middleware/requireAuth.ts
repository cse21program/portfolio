import type { RequestHandler } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { ACCESS_COOKIE } from "@common/utils/cookies";
import { verifyAccessToken } from "@common/utils/jwt";

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    /* Public routes ignore an expired cookie */
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    next(new AppError(ErrorCode.UNAUTHORIZED, "Authentication required", 401));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    next(new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired session", 401));
  }
};
