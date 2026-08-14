import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const usersModule: AppModule = {
  name: "users",
  basePath: "/users",
  router,
};
