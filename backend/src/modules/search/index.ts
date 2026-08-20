import { Router } from "express";
import { asyncHandler } from "@common/middleware/asyncHandler";
import type { AppModule } from "@common/types/module";
import { searchController } from "./search.controller";

const router = Router();

router.get("/", asyncHandler(searchController.search));

export const searchModule: AppModule = {
  name: "search",
  basePath: "/search",
  router,
};
