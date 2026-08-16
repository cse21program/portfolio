import type { RequestHandler } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";

export const requireRole = (...roles: Array<"CUSTOMER" | "ADMIN">): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(ErrorCode.UNAUTHORIZED, "Authentication required", 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource", 403));
      return;
    }

    next();
  };
};
