import { createApp } from "./app";
import { env } from "@common/config/env";
import { prisma } from "@common/database/prisma";
import { logger } from "@common/utils/logger";

const app = createApp();

const server = app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`API listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
  if (!env.ADMIN_BOOTSTRAP_EMAIL) {
    logger.warn("ADMIN_BOOTSTRAP_EMAIL is empty; sign-in will create customer accounts only");
  }
  if (env.S3_UPLOADS_BUCKET) {
    logger.info(`Media uploads: s3://${env.S3_UPLOADS_BUCKET}/media/`);
  } else if (env.NODE_ENV === "production") {
    logger.warn("S3_UPLOADS_BUCKET is empty; live uploads will stay on the instance disk");
  }
});

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
