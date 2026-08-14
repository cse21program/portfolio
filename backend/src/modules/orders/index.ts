import { Router } from "express";
import type { AppModule } from "@common/types/module";

const router = Router();

export const ordersModule: AppModule = {
  name: "orders",
  basePath: "/orders",
  router,
};
