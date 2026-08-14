import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const certificatesModule: AppModule = {
  name: "certificates",
  basePath: "/certificates",
  router,
};
