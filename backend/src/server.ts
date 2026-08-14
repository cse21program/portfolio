import { createApp } from "./app";
import { env } from "@common/config/env";
import { prisma } from "@common/database/prisma";
import { logger } from "@common/utils/logger";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
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
