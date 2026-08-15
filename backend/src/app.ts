import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env, isDev, isTest } from "@common/config/env";
import { errorHandler } from "@common/middleware/errorHandler";
import { notFoundHandler } from "@common/middleware/notFoundHandler";
import { sendSuccess } from "@common/utils/apiResponse";
import { modules, registerModules } from "@modules/index";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (!isTest) {
    app.use(morgan(isDev ? "dev" : "combined"));
  }

  const apiIndex = (_req: express.Request, res: express.Response) => {
    sendSuccess(
      res,
      {
        name: "Portfolio API",
        prefix: env.API_PREFIX,
        docs: {
          health: `${env.API_PREFIX}/health`,
          ready: `${env.API_PREFIX}/health/ready`,
          register: `POST ${env.API_PREFIX}/auth/register`,
          login: `POST ${env.API_PREFIX}/auth/login`,
          logout: `POST ${env.API_PREFIX}/auth/logout`,
          refresh: `POST ${env.API_PREFIX}/auth/refresh`,
          me: `GET ${env.API_PREFIX}/auth/me`,
          google: `GET ${env.API_PREFIX}/auth/google`,
        },
        modules: modules.map((mod) => `${env.API_PREFIX}${mod.basePath}`),
      },
      "Portfolio API",
    );
  };

  app.get("/", apiIndex);
  app.get(env.API_PREFIX, apiIndex);

  registerModules(app, env.API_PREFIX);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
