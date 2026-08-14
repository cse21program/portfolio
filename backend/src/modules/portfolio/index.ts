import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const portfolioModule: AppModule = {
  name: "portfolio",
  basePath: "/portfolio",
  router,
};
