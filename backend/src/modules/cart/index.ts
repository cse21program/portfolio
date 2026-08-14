import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const cartModule: AppModule = {
  name: "cart",
  basePath: "/cart",
  router,
};
