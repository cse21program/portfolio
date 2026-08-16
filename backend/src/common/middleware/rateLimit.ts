import type { Request, RequestHandler } from "express";
import { AppError, ErrorCode } from "@common/errors/AppError";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyFn: (req: Request) => string;
  message?: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (req, _res, next) => {
    const now = Date.now();
    const key = options.keyFn(req);
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.max) {
      next(
        new AppError(
          ErrorCode.TOO_MANY_REQUESTS,
          options.message ?? "Too many attempts. Try again later.",
          429,
        ),
      );
      return;
    }

    existing.count += 1;
    next();
  };
}
