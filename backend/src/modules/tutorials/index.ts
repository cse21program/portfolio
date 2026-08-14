import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const tutorialsModule: AppModule = {
  name: "tutorials",
  basePath: "/tutorials",
  router,
};
