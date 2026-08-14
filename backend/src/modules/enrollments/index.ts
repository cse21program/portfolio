import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const enrollmentsModule: AppModule = {
  name: "enrollments",
  basePath: "/enrollments",
  router,
};
