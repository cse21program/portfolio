import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const experienceModule: AppModule = {
  name: "experience",
  basePath: "/experience",
  router,
};
