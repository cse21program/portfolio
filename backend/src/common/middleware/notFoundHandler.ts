import type { NextFunction, Request, Response } from "express";
import { ErrorCode } from "../errors/AppError";

export function notFoundHandler(_req: Request, res: Response, _next: NextFunction) {
  return res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: "Route not found",
    },
  });
}
