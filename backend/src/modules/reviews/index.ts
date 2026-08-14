import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const reviewsModule: AppModule = {
  name: "reviews",
  basePath: "/reviews",
  router,
};
