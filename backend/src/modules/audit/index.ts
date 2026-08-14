import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const auditModule: AppModule = {
  name: "audit",
  basePath: "/audit",
  router,
};
