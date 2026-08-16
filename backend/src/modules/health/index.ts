import { Router } from "express";
import type { AppModule } from "@common/types/module";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { sendSuccess } from "@common/utils/apiResponse";
import { prisma } from "@common/database/prisma";
import { env } from "@common/config/env";
import { pingRedis } from "@common/utils/redis";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, {
      status: "ok",
      service: "portfolio-api",
      timestamp: new Date().toISOString(),
    });
  }),
);

router.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    let redis: "connected" | "skipped" = "skipped";
    if (env.REDIS_URL) {
      await pingRedis(env.REDIS_URL);
      redis = "connected";
    }
    sendSuccess(res, {
      status: "ready",
      database: "connected",
      redis,
    });
  }),
);

export const healthModule: AppModule = {
  name: "health",
  basePath: "/health",
  router,
};
