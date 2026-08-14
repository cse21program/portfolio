import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const educationModule: AppModule = {
  name: "education",
  basePath: "/education",
  router,
};
