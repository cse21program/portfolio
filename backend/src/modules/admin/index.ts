import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const adminModule: AppModule = {
  name: "admin",
  basePath: "/admin",
  router,
};
