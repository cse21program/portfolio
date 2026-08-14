import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, ErrorCode } from "../errors/AppError";
import { logger } from "../utils/logger";
import { isDev } from "../config/env";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Invalid request",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  logger.error(err);

  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: isDev && err instanceof Error ? err.message : "An unexpected error occurred",
    },
  });
}
