import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const paymentsModule: AppModule = {
  name: "payments",
  basePath: "/payments",
  router,
};
