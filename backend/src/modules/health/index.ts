import { Router } from "express";
import type { AppModule } from "@common/types/module";
import { asyncHandler } from "@common/middleware/asyncHandler";
import { sendSuccess } from "@common/utils/apiResponse";
import { prisma } from "@common/database/prisma";

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
    sendSuccess(res, {
      status: "ready",
      database: "connected",
    });
  }),
);

export const healthModule: AppModule = {
  name: "health",
  basePath: "/health",
  router,
};
