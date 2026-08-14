import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const topicsModule: AppModule = {
  name: "topics",
  basePath: "/topics",
  router,
};
