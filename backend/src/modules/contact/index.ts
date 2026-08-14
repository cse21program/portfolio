import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const contactModule: AppModule = {
  name: "contact",
  basePath: "/contact",
  router,
};
