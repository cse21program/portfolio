import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const servicesModule: AppModule = {
  name: "services",
  basePath: "/services",
  router,
};
