import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const analyticsModule: AppModule = {
  name: "analytics",
  basePath: "/analytics",
  router,
};
