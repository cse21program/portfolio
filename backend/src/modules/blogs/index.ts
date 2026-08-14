import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const blogsModule: AppModule = {
  name: "blogs",
  basePath: "/blogs",
  router,
};
