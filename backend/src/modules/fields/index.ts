import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const fieldsModule: AppModule = {
  name: "fields",
  basePath: "/fields",
  router,
};
