import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const mediaModule: AppModule = {
  name: "media",
  basePath: "/media",
  router,
};
